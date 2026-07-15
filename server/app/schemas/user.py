from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str | None = None


class UserUpdate(BaseModel):
    password_hash: str | None = None
    display_name: str | None = None


class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    display_name: str | None
    role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
