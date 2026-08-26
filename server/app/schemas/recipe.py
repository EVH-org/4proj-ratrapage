import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

_TAG_RE = re.compile(r"^[a-zA-Z0-9À-ÿ\- ]{2,30}$")
_MAX_TAGS = 10


def _validate_tags(value: list[str] | None) -> list[str] | None:
    if value is None:
        return None
    if len(value) > _MAX_TAGS:
        raise ValueError(f"{_MAX_TAGS} tags maximum par recette.")
    cleaned = []
    for label in value:
        s = label.strip()
        if not _TAG_RE.match(s):
            raise ValueError(f"Tag invalide : '{label}'.")
        cleaned.append(s)
    return cleaned


class RecipeStepCreate(BaseModel):
    step_order: int
    instruction: str = Field(..., max_length=1000)


class RecipeStepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recipe_id: UUID
    step_order: int
    instruction: str


class RecipeIngredientCreate(BaseModel):
    line_order: int
    name: str = Field(..., max_length=255)
    quantity: float | None = None
    unit: str | None = Field(None, max_length=50)
    note: str | None = Field(None, max_length=255)


class RecipeIngredientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recipe_id: UUID
    line_order: int
    name: str
    quantity: float | None
    unit: str | None
    note: str | None


class ImagePresignRequest(BaseModel):
    filename: str = Field(..., max_length=255)
    content_type: str = Field(..., max_length=100)


class ImagePresignResponse(BaseModel):
    object_key: str
    upload_url: str
    method: str = "PUT"


class ImageUrlResponse(BaseModel):
    url: str | None


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    label: str
    created_at: datetime


class RecipeCreate(BaseModel):
    scope_type: str = Field(..., pattern="^(personal|cookbook)$")
    visibility: str = Field("public", pattern="^(public|private)$")
    owner_user_id: UUID | None = None
    cookbook_id: UUID | None = None
    title: str = Field(..., max_length=255)
    description: str | None = Field(None, max_length=1000)
    prep_time_minutes: int | None = Field(None, ge=0)
    cook_time_minutes: int | None = Field(None, ge=0)
    servings: int | None = Field(None, ge=1)
    source_url: str | None = Field(None, max_length=500)
    image_url: str | None = Field(None, max_length=500)
    steps: list[RecipeStepCreate] = []
    ingredients: list[RecipeIngredientCreate] = []
    tags: list[str] | None = None

    @field_validator("tags")
    @classmethod
    def check_tags(cls, v):
        return _validate_tags(v)


class RecipeUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    description: str | None = Field(None, max_length=1000)
    visibility: str | None = Field(None, pattern="^(public|private)$")
    prep_time_minutes: int | None = Field(None, ge=0)
    cook_time_minutes: int | None = Field(None, ge=0)
    servings: int | None = Field(None, ge=1)
    source_url: str | None = Field(None, max_length=500)
    image_url: str | None = Field(None, max_length=500)
    steps: list[RecipeStepCreate] | None = None
    ingredients: list[RecipeIngredientCreate] | None = None
    tags: list[str] | None = None

    @field_validator("tags")
    @classmethod
    def check_tags(cls, v):
        return _validate_tags(v)


class RecipeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    scope_type: str
    visibility: str
    owner_user_id: UUID | None
    cookbook_id: UUID | None
    title: str
    description: str | None
    prep_time_minutes: int | None
    cook_time_minutes: int | None
    servings: int | None
    source_url: str | None
    image_object_key: str | None
    image_url: str | None = None
    created_by_user_id: UUID
    created_at: datetime
    updated_at: datetime
    steps: list[RecipeStepRead] = []
    ingredients: list[RecipeIngredientRead] = []
    tags: list[TagRead] = []
    is_favorite: bool = False


class RecipeExport(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str = Field(..., max_length=255)
    description: str | None = Field(None, max_length=1000)
    prep_time_minutes: int | None = Field(None, ge=0)
    cook_time_minutes: int | None = Field(None, ge=0)
    servings: int | None = Field(None, ge=1)
    source_url: str | None = Field(None, max_length=500)
    ingredients: list[RecipeIngredientRead] = []
    steps: list[RecipeStepRead] = []