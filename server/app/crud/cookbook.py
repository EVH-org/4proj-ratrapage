from datetime import datetime
import uuid
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.cookbook import Cookbook, CookbookMember, CookbookInvitation
from app.models.user import User
from app.schemas.cookbook import (
    CookbookCreate,
    CookbookUpdate,
    CookbookInvitationCreate,
    CookbookInvitationUpdate,
)


def get_cookbook_by_id(db: Session, cookbook_id: UUID) -> Cookbook | None:
    return db.query(Cookbook).filter(Cookbook.id == cookbook_id).first()


def list_cookbooks_for_user(
    db: Session, user_id: UUID, skip: int = 0, limit: int = 100
) -> list[Cookbook]:
    return (
        db.query(Cookbook)
        .join(CookbookMember, Cookbook.id == CookbookMember.cookbook_id)
        .filter(CookbookMember.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_cookbook(
    db: Session, data: CookbookCreate, owner_user_id: UUID
) -> Cookbook:
    cookbook = Cookbook(
        owner_user_id=owner_user_id,
        name=data.name,
        description=data.description,
        visibility=data.visibility,
    )
    db.add(cookbook)
    db.commit()
    db.refresh(cookbook)

    member = CookbookMember(
        cookbook_id=cookbook.id,
        user_id=owner_user_id,
        role="owner",
    )
    db.add(member)
    db.commit()
    db.refresh(cookbook)

    return cookbook


def update_cookbook(
    db: Session, cookbook: Cookbook, data: CookbookUpdate
) -> Cookbook:
    if data.name is not None:
        cookbook.name = data.name
    if data.description is not None:
        cookbook.description = data.description
    if data.visibility is not None:
        cookbook.visibility = data.visibility

    db.add(cookbook)
    db.commit()
    db.refresh(cookbook)
    return cookbook


def delete_cookbook(db: Session, cookbook: Cookbook) -> None:
    db.delete(cookbook)
    db.commit()


def get_cookbook_member(
    db: Session, cookbook_id: UUID, user_id: UUID
) -> CookbookMember | None:
    return (
        db.query(CookbookMember)
        .filter(
            CookbookMember.cookbook_id == cookbook_id,
            CookbookMember.user_id == user_id,
        )
        .first()
    )


def list_cookbook_members(
    db: Session, cookbook_id: UUID, skip: int = 0, limit: int = 100
) -> list[CookbookMember]:
    members = (
        db.query(CookbookMember)
        .filter(CookbookMember.cookbook_id == cookbook_id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    for member in members:
        member.user = db.query(User).filter(User.id == member.user_id).first()
    return members


def update_cookbook_member_role(
    db: Session, member: CookbookMember, role: str
) -> CookbookMember:
    member.role = role
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def delete_cookbook_member(db: Session, member: CookbookMember) -> None:
    db.delete(member)
    db.commit()


def add_cookbook_member(
    db: Session, cookbook_id: UUID, user_id: UUID, role: str
) -> CookbookMember:
    member = get_cookbook_member(db, cookbook_id, user_id)
    if member:
        member.role = role
    else:
        member = CookbookMember(
            cookbook_id=cookbook_id, user_id=user_id, role=role
        )
        db.add(member)
    db.commit()
    db.refresh(member)
    return member


def create_cookbook_invitation(
    db: Session, cookbook_id: UUID, data: CookbookInvitationCreate
) -> CookbookInvitation:
    token = str(uuid.uuid4())
    invitation = CookbookInvitation(
        cookbook_id=cookbook_id,
        token=token,
        role_assigned=data.role_assigned,
        expires_at=data.expires_at,
        status="pending",
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


def get_cookbook_invitations(
    db: Session, cookbook_id: UUID, skip: int = 0, limit: int = 100
) -> list[CookbookInvitation]:
    return (
        db.query(CookbookInvitation)
        .filter(CookbookInvitation.cookbook_id == cookbook_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_cookbook_invitation_by_token(
    db: Session, token: str
) -> CookbookInvitation | None:
    return (
        db.query(CookbookInvitation)
        .filter(CookbookInvitation.token == token)
        .first()
    )


def update_cookbook_invitation_status(
    db: Session, invitation: CookbookInvitation, status: str
) -> CookbookInvitation:
    invitation.status = status
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


def get_cookbook_invitation_by_id(
    db: Session, invitation_id: UUID
) -> CookbookInvitation | None:
    return (
        db.query(CookbookInvitation)
        .filter(CookbookInvitation.id == invitation_id)
        .first()
    )


def update_cookbook_invitation(
    db: Session, invitation: CookbookInvitation, data: CookbookInvitationUpdate
) -> CookbookInvitation:
    if data.role_assigned is not None:
        invitation.role_assigned = data.role_assigned
    if data.expires_at is not None:
        invitation.expires_at = data.expires_at
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


def delete_cookbook_invitation(db: Session, invitation: CookbookInvitation) -> None:
    db.delete(invitation)
    db.commit()
