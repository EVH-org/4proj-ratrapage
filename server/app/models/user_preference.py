import uuid

from sqlalchemy import ForeignKey, Integer, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserPreference(Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), primary_key=True
    )
    default_servings: Mapped[int | None] = mapped_column(Integer, nullable=True)
    diets: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    allergies: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    favorite_cuisines: Mapped[list[str] | None] = mapped_column(
        JSON, nullable=True
    )

    user = relationship("User", back_populates="preferences")