from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserRead


class CookbookCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: str | None = Field(None, max_length=1000)
    visibility: str = "private"


class CookbookUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    description: str | None = Field(None, max_length=1000)
    visibility: str | None = None


class CookbookRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_user_id: UUID
    name: str
    description: str | None
    visibility: str
    created_at: datetime
    updated_at: datetime


class CookbookMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cookbook_id: UUID
    user_id: UUID
    role: str
    joined_at: datetime
    user: UserRead | None = None


class CookbookMemberUpdate(BaseModel):
    role: str


class CookbookInvitationCreate(BaseModel):
    role_assigned: str = "reader"
    expires_at: datetime


class CookbookInvitationUpdate(BaseModel):
    role_assigned: str | None = None
    expires_at: datetime | None = None


class CookbookInvitationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    cookbook_id: UUID
    token: str
    role_assigned: str
    expires_at: datetime
    status: str
    created_at: datetime


class CookbookInvitationPublicInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    token: str
    cookbook_id: UUID
    cookbook_name: str
    role_assigned: str
    expires_at: datetime
    status: str
    created_at: datetime
