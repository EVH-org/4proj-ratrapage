from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.user import update_user_preferences
from app.db.session import get_db
from app.models.user_preference import UserPreference
from app.schemas.user_preference import UserPreferenceRead, UserPreferenceUpdate
from app.security import get_user_id

router = APIRouter(
    prefix="/preferences",
    tags=["preferences"],
    dependencies=[Depends(get_user_id)],
)


@router.get("/me", response_model=UserPreferenceRead)
def get_current_user_preferences(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    preferences = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == UUID(current_user_id))
        .first()
    )
    if not preferences:
        raise HTTPException(status_code=404, detail="Préférences introuvables")
    return preferences


@router.patch("/me", response_model=UserPreferenceRead)
def update_current_user_preferences(
    body: UserPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    preferences = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == UUID(current_user_id))
        .first()
    )
    if not preferences:
        raise HTTPException(status_code=404, detail="Préférences introuvables")
    return update_user_preferences(db, preferences, body)


@router.get("/{user_id}", response_model=UserPreferenceRead)
def get_user_preferences_route(user_id: UUID, db: Session = Depends(get_db)):
    preferences = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == user_id)
        .first()
    )
    if not preferences:
        raise HTTPException(status_code=404, detail="Préférences introuvables")
    return preferences