from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field

from app.security import MAX_PASSWORD_BYTES

MIN_PASSWORD_LENGTH = 8


def _check_password_bytes(value: str) -> str:
    if len(value.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError(
            f"Le mot de passe ne doit pas dépasser {MAX_PASSWORD_BYTES} octets"
        )
    return value


Password = Annotated[
    str,
    Field(min_length=MIN_PASSWORD_LENGTH),
    AfterValidator(_check_password_bytes),
]


class UserCreate(BaseModel):
    email: EmailStr
    password: Password
    display_name: str | None = None


class UserUpdate(BaseModel):
    password: Password | None = None
    display_name: str | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    display_name: str | None
    role: str
    created_at: datetime
    updated_at: datetime
