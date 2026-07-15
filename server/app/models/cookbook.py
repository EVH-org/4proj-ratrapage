from datetime import datetime
import uuid

from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Cookbook(Base):
    __tablename__ = "cookbooks"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    owner_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    visibility: Mapped[str] = mapped_column(String(50), nullable=False, default="private")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    owner = relationship("User", foreign_keys=[owner_user_id])
    members = relationship(
        "CookbookMember",
        back_populates="cookbook",
        cascade="all, delete-orphan",
    )
    invitations = relationship(
        "CookbookInvitation",
        back_populates="cookbook",
        cascade="all, delete-orphan",
    )


class CookbookMember(Base):
    __tablename__ = "cookbook_members"

    cookbook_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("cookbooks.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="reader")
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    cookbook = relationship("Cookbook", back_populates="members")
    user = relationship("User")


class CookbookInvitation(Base):
    __tablename__ = "cookbook_invitations"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    cookbook_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("cookbooks.id", ondelete="CASCADE"),
        nullable=False,
    )
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    role_assigned: Mapped[str] = mapped_column(
        String(50), nullable=False, default="reader"
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    cookbook = relationship("Cookbook", back_populates="invitations")
