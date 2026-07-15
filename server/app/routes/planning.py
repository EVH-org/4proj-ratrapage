from datetime import date
from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.meal_plan import MealPlanEntry
from app.models.recipe import Recipe
from app.schemas.meal_plan import MealPlanEntryCreate, MealPlanEntryRead, ShoppingListItem
from app.security import get_user_id
from app.routes.recipes import _check_recipe_read_permission

router = APIRouter(prefix="/planning", tags=["planning"])


@router.get("", response_model=list[MealPlanEntryRead])
def list_planning(
    start: date = Query(...),
    end: date = Query(...),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    entries = (
        db.query(MealPlanEntry)
        .filter(
            MealPlanEntry.user_id == UUID(current_user_id),
            MealPlanEntry.date >= start,
            MealPlanEntry.date <= end,
        )
        .order_by(MealPlanEntry.date.asc(), MealPlanEntry.slot.asc())
        .all()
    )
    for e in entries:
        e.recipe_title = e.recipe.title if e.recipe else ""
    return entries


@router.post("", response_model=MealPlanEntryRead, status_code=status.HTTP_201_CREATED)
def create_planning_entry(
    body: MealPlanEntryCreate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    recipe = db.query(Recipe).filter(Recipe.id == body.recipe_id).first()
    if not recipe:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recette introuvable.")

    _check_recipe_read_permission(db, recipe, current_user_id)

    existing = (
        db.query(MealPlanEntry)
        .filter(
            MealPlanEntry.user_id == UUID(current_user_id),
            MealPlanEntry.date == body.date,
            MealPlanEntry.slot == body.slot,
        )
        .first()
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ce créneau est déjà occupé.")

    entry = MealPlanEntry(
        user_id=UUID(current_user_id),
        date=body.date,
        slot=body.slot,
        recipe_id=body.recipe_id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_planning_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    entry = (
        db.query(MealPlanEntry)
        .filter(MealPlanEntry.id == entry_id)
        .first()
    )
    if not entry:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Entrée de planning introuvable.")
    if str(entry.user_id) != current_user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Accès refusé.")
    db.delete(entry)
    db.commit()


@router.get("/shopping-list", response_model=list[ShoppingListItem])
def get_shopping_list(
    start: date = Query(...),
    end: date = Query(...),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    entries = (
        db.query(MealPlanEntry)
        .filter(
            MealPlanEntry.user_id == UUID(current_user_id),
            MealPlanEntry.date >= start,
            MealPlanEntry.date <= end,
        )
        .all()
    )

    aggregated: dict[tuple[str, str | None], float | None] = defaultdict(lambda: 0.0)

    for entry in entries:
        for ing in entry.recipe.ingredients:
            key = (ing.name, ing.unit)
            if ing.quantity is not None:
                aggregated[key] += ing.quantity
            else:
                if aggregated[key] == 0.0:
                    aggregated[key] = None

    result = []
    for (name, unit), qty in sorted(aggregated.items()):
        result.append(ShoppingListItem(name=name, quantity=qty if qty is not None else None, unit=unit))

    return result