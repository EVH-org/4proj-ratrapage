from uuid import UUID

from sqlalchemy import func, or_ as sa_or, select as sa_select
from sqlalchemy.orm import Session

from app.models.recipe import Recipe, RecipeStep, RecipeIngredient, Tag, RecipeFavorite, RecipeTag
from app.models.cookbook import Cookbook, CookbookMember
from app.schemas.recipe import RecipeCreate, RecipeUpdate


def _cookbook_ids_for_user(db: Session, user_id: UUID):
    return (
        db.query(CookbookMember.cookbook_id)
        .filter(CookbookMember.user_id == user_id)
        .subquery()
    )


def _apply_updates(obj, data, fields):
    for f in fields:
        v = getattr(data, f, None)
        if v is not None:
            setattr(obj, f, v)


def get_recipe_by_id(db: Session, recipe_id: UUID) -> Recipe | None:
    return db.query(Recipe).filter(Recipe.id == recipe_id).first()


def list_personal_recipes(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    favorites_only: bool = False,
) -> list[Recipe]:
    query = db.query(Recipe).filter(
        Recipe.scope_type == "personal", Recipe.owner_user_id == user_id
    )
    if favorites_only:
        query = query.join(
            RecipeFavorite,
            (RecipeFavorite.recipe_id == Recipe.id)
            & (RecipeFavorite.user_id == user_id),
        )
    return query.offset(skip).limit(limit).all()


def list_my_recipes(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
) -> list[Recipe]:
    sub = _cookbook_ids_for_user(db, user_id)
    return (
        db.query(Recipe)
        .filter(
            sa_or(
                (Recipe.scope_type == "personal") & (Recipe.owner_user_id == user_id),
                (Recipe.scope_type == "cookbook") & Recipe.cookbook_id.in_(sa_select(sub.c.cookbook_id)),
            )
        )
        .order_by(Recipe.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def list_cookbook_recipes(
    db: Session,
    cookbook_id: UUID,
    skip: int = 0,
    limit: int = 100,
    favorites_only: bool = False,
    current_user_id: UUID | None = None,
) -> list[Recipe]:
    query = db.query(Recipe).filter(
        Recipe.scope_type == "cookbook", Recipe.cookbook_id == cookbook_id
    )
    if favorites_only and current_user_id:
        query = query.join(
            RecipeFavorite,
            (RecipeFavorite.recipe_id == Recipe.id)
            & (RecipeFavorite.user_id == current_user_id),
        )
    return query.offset(skip).limit(limit).all()


def _process_recipe_tags(db: Session, recipe: Recipe, tag_labels_input: list[str] | None) -> None:
    if tag_labels_input is None:
        return
    labels = list(dict.fromkeys(s.strip().lower() for s in tag_labels_input if s.strip()))
    if not labels:
        recipe.tags = []
        return
    existing = {t.label.lower(): t for t in db.query(Tag).filter(func.lower(Tag.label).in_(labels)).all()}
    recipe.tags = []
    for l in labels:
        if l not in existing:
            existing[l] = Tag(label=l)
            db.add(existing[l])
        recipe.tags.append(existing[l])


def create_recipe(db: Session, data: RecipeCreate, creator_user_id: UUID) -> Recipe:
    recipe = Recipe(
        scope_type=data.scope_type,
        visibility=data.visibility,
        owner_user_id=data.owner_user_id if data.scope_type == "personal" else None,
        cookbook_id=data.cookbook_id if data.scope_type == "cookbook" else None,
        title=data.title,
        description=data.description,
        prep_time_minutes=data.prep_time_minutes,
        cook_time_minutes=data.cook_time_minutes,
        servings=data.servings,
        source_url=data.source_url,
        image_url=data.image_url,
        created_by_user_id=creator_user_id,
    )
    _process_recipe_tags(db, recipe, data.tags)
    db.add(recipe)
    db.commit()
    db.refresh(recipe)

    for step_data in data.steps:
        db.add(RecipeStep(
            recipe_id=recipe.id,
            step_order=step_data.step_order,
            instruction=step_data.instruction,
        ))
    for ing_data in data.ingredients:
        db.add(RecipeIngredient(
            recipe_id=recipe.id,
            line_order=ing_data.line_order,
            name=ing_data.name,
            quantity=ing_data.quantity,
            unit=ing_data.unit,
            note=ing_data.note,
        ))
    db.commit()
    db.refresh(recipe)
    return recipe


def update_recipe(db: Session, recipe: Recipe, data: RecipeUpdate) -> Recipe:
    _apply_updates(recipe, data, [
        "title", "description", "visibility",
        "prep_time_minutes", "cook_time_minutes", "servings",
        "source_url",
    ])
    _process_recipe_tags(db, recipe, data.tags)
    db.add(recipe)

    if data.steps is not None:
        db.query(RecipeStep).filter(RecipeStep.recipe_id == recipe.id).delete()
        for step_data in data.steps:
            db.add(RecipeStep(
                recipe_id=recipe.id,
                step_order=step_data.step_order,
                instruction=step_data.instruction,
            ))

    if data.ingredients is not None:
        db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.id).delete()
        for ing_data in data.ingredients:
            db.add(RecipeIngredient(
                recipe_id=recipe.id,
                line_order=ing_data.line_order,
                name=ing_data.name,
                quantity=ing_data.quantity,
                unit=ing_data.unit,
                note=ing_data.note,
            ))

    db.commit()
    db.refresh(recipe)
    return recipe


def list_all_tags(db: Session) -> list[Tag]:
    return db.query(Tag).order_by(Tag.label.asc()).all()


def list_recipes_by_tags(
    db: Session,
    user_id: UUID,
    tag_labels: list[str],
    skip: int = 0,
    limit: int = 20,
) -> list[Recipe]:
    subq = (
        sa_select(RecipeTag.recipe_id)
        .join(Tag, RecipeTag.tag_id == Tag.id)
        .filter(Tag.label.in_(tag_labels))
        .subquery()
    )
    return (
        db.query(Recipe)
        .filter(
            Recipe.scope_type == "personal",
            Recipe.id.in_(sa_select(subq.c.recipe_id)),
            (Recipe.visibility == "public") | (Recipe.owner_user_id == user_id),
        )
        .offset(skip).limit(limit)
        .all()
    )


def list_all_recipes_by_tag(
    db: Session,
    tag_label: str,
    current_user_id: UUID | None = None,
    skip: int = 0,
    limit: int = 20,
) -> list[Recipe]:
    tagged_subq = (
        db.query(RecipeTag.recipe_id)
        .join(Tag, RecipeTag.tag_id == Tag.id)
        .filter(Tag.label == tag_label)
        .subquery()
    )
    vis = (Recipe.visibility == "public")
    if current_user_id:
        vis = vis | (Recipe.owner_user_id == current_user_id)

    personal = db.query(Recipe).filter(
        Recipe.scope_type == "personal",
        Recipe.id.in_(tagged_subq),
        vis,
    )
    cookbook = db.query(Recipe).join(
        Cookbook, Recipe.cookbook_id == Cookbook.id
    ).filter(
        Cookbook.visibility == "public",
        Recipe.scope_type == "cookbook",
        Recipe.id.in_(tagged_subq),
    )
    return personal.union_all(cookbook).order_by(Recipe.created_at.desc()).offset(skip).limit(limit).all()


def list_user_cookbook_recipes(
    db: Session, user_id: UUID,
    skip: int = 0, limit: int = 20,
) -> list[Recipe]:
    sub = _cookbook_ids_for_user(db, user_id)
    return (
        db.query(Recipe)
        .filter(
            Recipe.scope_type == "cookbook",
            Recipe.cookbook_id.in_(sa_select(sub.c.cookbook_id)),
        )
        .offset(skip).limit(limit)
        .all()
    )


def add_recipe_to_favorites(db: Session, user_id: UUID, recipe_id: UUID) -> RecipeFavorite:
    fav = (
        db.query(RecipeFavorite)
        .filter(RecipeFavorite.user_id == user_id, RecipeFavorite.recipe_id == recipe_id)
        .first()
    )
    if not fav:
        fav = RecipeFavorite(user_id=user_id, recipe_id=recipe_id)
        db.add(fav)
        db.commit()
        db.refresh(fav)
    return fav


def remove_recipe_from_favorites(db: Session, user_id: UUID, recipe_id: UUID) -> bool:
    fav = (
        db.query(RecipeFavorite)
        .filter(RecipeFavorite.user_id == user_id, RecipeFavorite.recipe_id == recipe_id)
        .first()
    )
    if fav:
        db.delete(fav)
        db.commit()
        return True
    return False


def get_user_favorite_recipe_ids(db: Session, user_id: UUID) -> set[UUID]:
    return {f[0] for f in db.query(RecipeFavorite.recipe_id).filter(RecipeFavorite.user_id == user_id).all()}


def delete_recipe(db: Session, recipe: Recipe) -> None:
    db.delete(recipe)
    db.commit()


def search_recipes(
    db: Session,
    user_id: UUID,
    q: str | None = None,
    tags: list[str] | None = None,
    prep_time_min: int | None = None,
    prep_time_max: int | None = None,
    cook_time_min: int | None = None,
    cook_time_max: int | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 20,
) -> list[Recipe]:
    query = db.query(Recipe).filter(
        sa_or(
            (Recipe.scope_type == "personal") & (Recipe.visibility == "public"),
            (Recipe.scope_type == "personal") & (Recipe.owner_user_id == user_id),
        )
    )

    if q:
        pattern = f"%{q}%"
        query = query.filter(sa_or(
            Recipe.title.ilike(pattern),
            Recipe.description.ilike(pattern),
        ))

    if tags:
        sub = (
            db.query(RecipeTag.recipe_id)
            .join(Tag, RecipeTag.tag_id == Tag.id)
            .filter(func.lower(Tag.label).in_([t.strip().lower() for t in tags]))
            .subquery()
        )
        query = query.filter(Recipe.id.in_(sub))

    if prep_time_min is not None:
        query = query.filter(Recipe.prep_time_minutes >= prep_time_min)
    if prep_time_max is not None:
        query = query.filter(Recipe.prep_time_minutes <= prep_time_max)
    if cook_time_min is not None:
        query = query.filter(Recipe.cook_time_minutes >= cook_time_min)
    if cook_time_max is not None:
        query = query.filter(Recipe.cook_time_minutes <= cook_time_max)

    sort_cols = {
        "created_at": Recipe.created_at,
        "title": Recipe.title,
        "prep_time": Recipe.prep_time_minutes,
        "cook_time": Recipe.cook_time_minutes,
    }
    col = sort_cols.get(sort_by, Recipe.created_at)
    query = query.order_by(col.asc() if sort_order == "asc" else col.desc())

    return query.offset(skip).limit(limit).all()