from uuid import UUID

from pydantic import BaseModel


class UserPreferenceRead(BaseModel):
    user_id: UUID
    default_servings: int | None
    diets: list[str] | None
    allergies: list[str] | None
    favorite_cuisines: list[str] | None

    class Config:
        from_attributes = True


class UserPreferenceUpdate(BaseModel):
    default_servings: int | None = None
    diets: list[str] | None = None
    allergies: list[str] | None = None
    favorite_cuisines: list[str] | None = None
