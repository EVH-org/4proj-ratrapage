from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

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
    id: UUID
    owner_user_id: UUID
    name: str
    description: str | None
    visibility: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CookbookMemberRead(BaseModel):
    cookbook_id: UUID
    user_id: UUID
    role: str
    joined_at: datetime
    user: UserRead | None = None

    class Config:
        from_attributes = True


class CookbookMemberUpdate(BaseModel):
    role: str


class CookbookInvitationCreate(BaseModel):
    role_assigned: str = "reader"
    expires_at: datetime


class CookbookInvitationRead(BaseModel):
    id: UUID
    cookbook_id: UUID
    token: str
    role_assigned: str
    expires_at: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
