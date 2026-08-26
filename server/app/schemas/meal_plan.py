from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MealPlanEntryCreate(BaseModel):
    date: date
    slot: str = Field(..., pattern="^(midi|soir)$")
    recipe_id: UUID


class MealPlanEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    date: date
    slot: str
    recipe_id: UUID
    recipe_title: str = ""
    created_at: datetime


class ShoppingListItem(BaseModel):
    name: str
    quantity: float | None = None
    unit: str | None = None