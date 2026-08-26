from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserPreferenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    default_servings: int | None
    diets: list[str] | None
    allergies: list[str] | None
    favorite_cuisines: list[str] | None


class UserPreferenceUpdate(BaseModel):
    default_servings: int | None = None
    diets: list[str] | None = None
    allergies: list[str] | None = None
    favorite_cuisines: list[str] | None = None
