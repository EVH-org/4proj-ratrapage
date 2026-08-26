from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.user_preference import UserPreferenceUpdate
from app.security import hash_password


def get_user_by_id(db: Session, user_id: UUID) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def list_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return (
        db.query(User)
        .order_by(User.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_user(db: Session, data: UserCreate) -> User:
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    preferences = UserPreference(user_id=user.id)
    db.add(preferences)
    db.commit()

    return user


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    if data.password is not None:
        user.password_hash = hash_password(data.password)
    if data.display_name is not None:
        user.display_name = data.display_name

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()


def update_user_preferences(
    db: Session, preferences: UserPreference, data: UserPreferenceUpdate
) -> UserPreference:
    if data.default_servings is not None:
        preferences.default_servings = data.default_servings
    if data.diets is not None:
        preferences.diets = data.diets
    if data.allergies is not None:
        preferences.allergies = data.allergies
    if data.favorite_cuisines is not None:
        preferences.favorite_cuisines = data.favorite_cuisines

    db.add(preferences)
    db.commit()
    db.refresh(preferences)
    return preferences
