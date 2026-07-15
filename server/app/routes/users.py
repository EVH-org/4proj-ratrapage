from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud.user import (
    delete_user,
    get_user_by_id,
    list_users,
    update_user,
)
from app.crud.recipe import list_my_recipes
from app.db.session import get_db
from app.schemas.user import UserRead, UserUpdate
from app.schemas.recipe import RecipeRead
from app.routes.recipes import _populate
from app.security import get_user_id

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_user_id)],
)


@router.get("/me", response_model=UserRead)
def get_current_user(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    user = get_user_by_id(db, UUID(current_user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")
    return user


@router.patch("/me", response_model=UserRead)
def update_current_user(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    user = get_user_by_id(db, UUID(current_user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")
    return update_user(db, user, body)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    user = get_user_by_id(db, UUID(current_user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")
    delete_user(db, user)


@router.get("/me/recipes", response_model=list[RecipeRead])
def get_my_recipes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    skip = (page - 1) * page_size
    recipes = list_my_recipes(db, UUID(current_user_id), skip=skip, limit=page_size)
    _populate(db, recipes, current_user_id)
    return recipes


@router.get("", response_model=list[UserRead])
def list_users_route(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    return list_users(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserRead)
def get_user_route(user_id: UUID, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")
    return user