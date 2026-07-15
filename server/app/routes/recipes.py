import random
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.crud.recipe import (
    add_recipe_to_favorites, create_recipe, delete_recipe,
    get_recipe_by_id, get_user_favorite_recipe_ids,
    list_all_recipes_by_tag, list_all_tags, list_cookbook_recipes,
    list_personal_recipes, list_recipes_by_tags, list_user_cookbook_recipes,
    remove_recipe_from_favorites, search_recipes, update_recipe,
)
from app.crud.cookbook import get_cookbook_member, get_cookbook_by_id
from app.models.recipe import Recipe
from app.models.cookbook import Cookbook
from app.schemas.recipe import (
    ImagePresignRequest, ImagePresignResponse,
    RecipeCreate, RecipeExport, RecipeIngredientCreate,
    RecipeRead, RecipeStepCreate, RecipeUpdate, TagRead,
)
from app.security import get_user_id, get_optional_user_id
from app.storage.s3 import create_presigned_put, create_presigned_get, delete_object

router = APIRouter(tags=["recipes"])


def _resolve_scope(
    db: Session, body: RecipeCreate, current_user_id: str,
):
    if body.scope_type == "personal":
        body.owner_user_id = UUID(current_user_id)
        body.cookbook_id = None
    elif body.scope_type == "cookbook":
        if not body.cookbook_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "cookbook_id obligatoire pour les recettes de cookbook.")
        cookbook = get_cookbook_by_id(db, body.cookbook_id)
        if not cookbook:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Cookbook introuvable.")
        member = get_cookbook_member(db, body.cookbook_id, UUID(current_user_id))
        if not member or member.role not in ("owner", "editor"):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Role owner ou editor requis pour ajouter une recette.")
        body.owner_user_id = None


def _check_recipe_read_permission(
    db: Session, recipe, current_user_id: str | None,
) -> None:
    if recipe.scope_type == "personal":
        if recipe.visibility == "public":
            return
        if not current_user_id or str(recipe.owner_user_id) != current_user_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Accès refusé à cette recette personnelle.")
    elif recipe.scope_type == "cookbook":
        cookbook = get_cookbook_by_id(db, recipe.cookbook_id)
        if not cookbook:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Cookbook de la recette introuvable.")
        if cookbook.visibility == "private":
            if not current_user_id:
                raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentification requise.")
            member = get_cookbook_member(db, recipe.cookbook_id, UUID(current_user_id))
            if not member:
                raise HTTPException(status.HTTP_403_FORBIDDEN, "Acces refuse a cette recette.")


def _check_recipe_write_permission(db: Session, recipe, current_user_id: str) -> None:
    if recipe.scope_type == "personal":
        if str(recipe.owner_user_id) != current_user_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Modification non autorisee.")
    elif recipe.scope_type == "cookbook":
        member = get_cookbook_member(db, recipe.cookbook_id, UUID(current_user_id))
        if not member or member.role not in ("owner", "editor"):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Seuls les editeurs ou proprietaires peuvent modifier.")


def _populate(db, recipes, user_id):
    if not isinstance(recipes, list):
        recipes = [recipes]
    fav_ids = get_user_favorite_recipe_ids(db, UUID(user_id)) if user_id else set()
    for recipe in recipes:
        if recipe.image_object_key:
            recipe.image_url = create_presigned_get(recipe.image_object_key)
        recipe.is_favorite = recipe.id in fav_ids


@router.post("/recipes", response_model=RecipeRead, status_code=status.HTTP_201_CREATED)
def create_new_recipe(
    body: RecipeCreate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    _resolve_scope(db, body, current_user_id)
    recipe = create_recipe(db, body, UUID(current_user_id))
    _populate(db, recipe, current_user_id)
    return recipe


@router.get("/recipes/explore")
def explore_recipes(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    uid = UUID(current_user_id)
    sections = []

    personal = list_personal_recipes(db, uid, skip=0, limit=20)
    _populate(db, personal, current_user_id)
    if personal:
        sections.append({"title": "Mes recettes", "subtitle": "Vos creations personnelles", "recipes": personal})

    personal_fav = list_personal_recipes(db, uid, skip=0, limit=20, favorites_only=True)
    _populate(db, personal_fav, current_user_id)
    if personal_fav:
        sections.append({"title": "Mes recettes favorites", "subtitle": "Vos recettes preferees", "recipes": personal_fav})

    public_recipes = (
        db.query(Recipe)
        .filter(Recipe.scope_type == "personal", Recipe.visibility == "public", Recipe.owner_user_id != uid)
        .order_by(Recipe.created_at.desc()).limit(20).all()
    )
    _populate(db, public_recipes, current_user_id)
    if public_recipes:
        sections.append({"title": "Toutes les recettes", "subtitle": "Les dernieres recettes partagees", "recipes": public_recipes})

    public_cb = (
        db.query(Recipe).join(Cookbook, Recipe.cookbook_id == Cookbook.id)
        .filter(Cookbook.visibility == "public", Recipe.scope_type == "cookbook")
        .order_by(Recipe.created_at.desc()).limit(20).all()
    )
    _populate(db, public_cb, current_user_id)
    if public_cb:
        sections.append({"title": "Recettes des cookbooks publics", "subtitle": "Partagees dans les livres publics", "recipes": public_cb})

    all_tags = list_all_tags(db)
    random.shuffle(all_tags)
    for tag_obj in all_tags[:6]:
        tagged = list_all_recipes_by_tag(db, tag_obj.label, current_user_id=uid, skip=0, limit=8)
        _populate(db, tagged, current_user_id)
        if tagged:
            sections.append({"title": f"Recettes << {tag_obj.label} >>", "subtitle": f"Recettes tagguees << {tag_obj.label} >>", "recipes": tagged})

    cb_recipes = list_user_cookbook_recipes(db, uid, skip=0, limit=20)
    _populate(db, cb_recipes, current_user_id)
    if cb_recipes:
        sections.append({"title": "Recettes dans mes cookbooks", "subtitle": "Les recettes partagees de vos livres", "recipes": cb_recipes})

    return sections


@router.get("/recipes/search", response_model=list[RecipeRead])
def search_recipes_endpoint(
    q: str | None = Query(None),
    tags: str | None = Query(None),
    prep_time_min: int | None = Query(None, ge=0),
    prep_time_max: int | None = Query(None, ge=0),
    cook_time_min: int | None = Query(None, ge=0),
    cook_time_max: int | None = Query(None, ge=0),
    sort_by: str = Query("created_at", pattern="^(created_at|title|prep_time|cook_time)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    skip = (page - 1) * page_size
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else None
    recipes = search_recipes(
        db, UUID(current_user_id),
        q=q, tags=tag_list,
        prep_time_min=prep_time_min, prep_time_max=prep_time_max,
        cook_time_min=cook_time_min, cook_time_max=cook_time_max,
        sort_by=sort_by, sort_order=sort_order,
        skip=skip, limit=page_size,
    )
    _populate(db, recipes, current_user_id)
    return recipes


@router.get("/recipes/{recipe_id}", response_model=RecipeRead)
def get_recipe(
    recipe_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str | None = Depends(get_optional_user_id),
):
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recette introuvable.")
    _check_recipe_read_permission(db, recipe, current_user_id)
    _populate(db, recipe, current_user_id)
    return recipe


@router.patch("/recipes/{recipe_id}", response_model=RecipeRead)
def update_existing_recipe(
    recipe_id: UUID,
    body: RecipeUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recette introuvable.")
    _check_recipe_write_permission(db, recipe, current_user_id)
    updated = update_recipe(db, recipe, body)
    _populate(db, updated, current_user_id)
    return updated


@router.delete("/recipes/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_recipe(
    recipe_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recette introuvable.")
    _check_recipe_write_permission(db, recipe, current_user_id)
    if recipe.image_object_key:
        delete_object(recipe.image_object_key)
    delete_recipe(db, recipe)


@router.get("/recipes", response_model=list[RecipeRead])
def get_recipes_list(
    scope: str = Query("personal", pattern="^(personal|cookbook)$"),
    cookbook_id: UUID | None = Query(None),
    favorites_only: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    skip = (page - 1) * page_size
    uid = UUID(current_user_id)

    if scope == "personal":
        recipes = list_personal_recipes(db, uid, skip=skip, limit=page_size, favorites_only=favorites_only)
    else:
        if not cookbook_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "cookbook_id obligatoire.")
        cookbook = get_cookbook_by_id(db, cookbook_id)
        if not cookbook:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Cookbook introuvable.")
        if cookbook.visibility == "private" and not get_cookbook_member(db, cookbook_id, uid):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Acces refuse.")
        recipes = list_cookbook_recipes(db, cookbook_id, skip=skip, limit=page_size, favorites_only=favorites_only, current_user_id=uid)

    _populate(db, recipes, current_user_id)
    return recipes


@router.post("/recipes/{recipe_id}/image/presign", response_model=ImagePresignResponse)
def get_recipe_image_upload_presign(
    recipe_id: UUID, body: ImagePresignRequest,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recette introuvable.")
    _check_recipe_write_permission(db, recipe, current_user_id)
    object_key = f"recipes/{recipe.id}/{body.filename}"
    upload_url = create_presigned_put(object_key, body.content_type)
    recipe.image_object_key = object_key
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return {"object_key": object_key, "upload_url": upload_url, "method": "PUT"}


@router.delete("/recipes/{recipe_id}/image", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe_image(
    recipe_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recette introuvable.")
    _check_recipe_write_permission(db, recipe, current_user_id)
    if recipe.image_object_key:
        delete_object(recipe.image_object_key)
        recipe.image_object_key = None
        db.add(recipe)
        db.commit()


@router.get("/recipes/{recipe_id}/export", response_model=RecipeExport)
def export_recipe_to_json(
    recipe_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str | None = Depends(get_optional_user_id),
) -> RecipeExport:
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recette introuvable.")
    _check_recipe_read_permission(db, recipe, current_user_id)
    return recipe


@router.post("/recipes/import", response_model=RecipeRead, status_code=status.HTTP_201_CREATED)
def import_recipe_from_json(
    body: RecipeExport,
    scope_type: str = Query("personal", pattern="^(personal|cookbook)$"),
    cookbook_id: UUID | None = Query(None),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
) -> RecipeRead:
    create_body = RecipeCreate(
        scope_type=scope_type,
        owner_user_id=UUID(current_user_id) if scope_type == "personal" else None,
        cookbook_id=cookbook_id if scope_type == "cookbook" else None,
        title=body.title, description=body.description,
        prep_time_minutes=body.prep_time_minutes,
        cook_time_minutes=body.cook_time_minutes,
        servings=body.servings, source_url=body.source_url,
        steps=[RecipeStepCreate(step_order=s.step_order, instruction=s.instruction) for s in body.steps],
        ingredients=[RecipeIngredientCreate(line_order=i.line_order, name=i.name, quantity=i.quantity, unit=i.unit, note=i.note) for i in body.ingredients],
    )
    _resolve_scope(db, create_body, current_user_id)
    recipe = create_recipe(db, create_body, UUID(current_user_id))
    _populate(db, recipe, current_user_id)
    return recipe


@router.get("/tags", response_model=list[TagRead])
def get_all_tags(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    return list_all_tags(db)


@router.post("/recipes/{recipe_id}/favorite")
def favorite_recipe(
    recipe_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recette introuvable.")
    _check_recipe_read_permission(db, recipe, current_user_id)
    add_recipe_to_favorites(db, UUID(current_user_id), recipe_id)
    return {"message": "Recette ajoutee aux favoris."}


@router.delete("/recipes/{recipe_id}/favorite")
def unfavorite_recipe(
    recipe_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recette introuvable.")
    _check_recipe_read_permission(db, recipe, current_user_id)
    remove_recipe_from_favorites(db, UUID(current_user_id), recipe_id)
    return {"message": "Recette retiree des favoris."}