from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.crud.cookbook import (
    add_cookbook_member, create_cookbook, create_cookbook_invitation,
    delete_cookbook, delete_cookbook_member, get_cookbook_by_id,
    get_cookbook_invitation_by_token, get_cookbook_invitations,
    get_cookbook_member, list_cookbook_members, list_cookbooks_for_user,
    update_cookbook, update_cookbook_invitation_status, update_cookbook_member_role,
)
from app.schemas.cookbook import (
    CookbookCreate, CookbookUpdate, CookbookRead,
    CookbookMemberRead, CookbookMemberUpdate,
    CookbookInvitationCreate, CookbookInvitationRead,
)
from app.security import get_user_id, get_optional_user_id

router = APIRouter(tags=["cookbooks"])


def _ok(v):
    return v in ("public", "private")


def _get_cookbook_or_404(db: Session, cookbook_id: UUID):
    cb = get_cookbook_by_id(db, cookbook_id)
    if not cb:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cookbook introuvable")
    return cb


def _require_owner(db: Session, cookbook_id: UUID, user_id: str) -> None:
    member = get_cookbook_member(db, cookbook_id, UUID(user_id))
    if not member or member.role != "owner":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Action non autorisee. Proprietaire requis.")


@router.post("/cookbooks", response_model=CookbookRead, status_code=status.HTTP_201_CREATED)
def create_new_cookbook(
    body: CookbookCreate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    if not _ok(body.visibility):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Visibilité invalide. Doit être 'public' ou 'private'")
    return create_cookbook(db, body, UUID(current_user_id))


@router.get("/cookbooks", response_model=list[CookbookRead])
def get_user_cookbooks(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    return list_cookbooks_for_user(db, UUID(current_user_id), skip=skip, limit=limit)


@router.get("/cookbooks/{cookbook_id}", response_model=CookbookRead)
def get_cookbook(
    cookbook_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str | None = Depends(get_optional_user_id),
):
    cookbook = _get_cookbook_or_404(db, cookbook_id)
    if cookbook.visibility == "public":
        return cookbook
    if not current_user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentification requise pour ce cookbook privé")
    member = get_cookbook_member(db, cookbook_id, UUID(current_user_id))
    if not member:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Accès refusé à ce cookbook privé")
    return cookbook


@router.patch("/cookbooks/{cookbook_id}", response_model=CookbookRead)
def update_existing_cookbook(
    cookbook_id: UUID,
    body: CookbookUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    cookbook = _get_cookbook_or_404(db, cookbook_id)
    _require_owner(db, cookbook_id, current_user_id)
    if body.visibility is not None and not _ok(body.visibility):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Visibilité invalide. Doit être 'public' ou 'private'")
    return update_cookbook(db, cookbook, body)


@router.delete("/cookbooks/{cookbook_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_cookbook(
    cookbook_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    cookbook = _get_cookbook_or_404(db, cookbook_id)
    _require_owner(db, cookbook_id, current_user_id)
    delete_cookbook(db, cookbook)


@router.get("/cookbooks/{cookbook_id}/members", response_model=list[CookbookMemberRead])
def list_members(
    cookbook_id: UUID,
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    cookbook = _get_cookbook_or_404(db, cookbook_id)
    _require_owner(db, cookbook_id, current_user_id)
    return list_cookbook_members(db, cookbook_id, skip=skip, limit=limit)


@router.patch("/cookbooks/{cookbook_id}/members/{user_id}", response_model=CookbookMemberRead)
def update_member(
    cookbook_id: UUID, user_id: UUID,
    body: CookbookMemberUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    cookbook = _get_cookbook_or_404(db, cookbook_id)
    _require_owner(db, cookbook_id, current_user_id)
    if body.role not in ("reader", "editor"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Role invalide. Seuls 'reader' et 'editor' sont autorises.")
    member = get_cookbook_member(db, cookbook_id, user_id)
    if not member:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Membre introuvable")
    if member.role == "owner" or user_id == cookbook.owner_user_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Impossible de modifier le role du proprietaire")
    return update_cookbook_member_role(db, member, body.role)


@router.delete("/cookbooks/{cookbook_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    cookbook_id: UUID, user_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    cookbook = _get_cookbook_or_404(db, cookbook_id)
    _require_owner(db, cookbook_id, current_user_id)
    member = get_cookbook_member(db, cookbook_id, user_id)
    if not member:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Membre introuvable")
    if member.role == "owner" or user_id == cookbook.owner_user_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Impossible de supprimer le proprietaire")
    delete_cookbook_member(db, member)


@router.post("/cookbooks/{cookbook_id}/invitations", response_model=CookbookInvitationRead, status_code=status.HTTP_201_CREATED)
def create_invitation(
    cookbook_id: UUID,
    body: CookbookInvitationCreate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    cookbook = _get_cookbook_or_404(db, cookbook_id)
    _require_owner(db, cookbook_id, current_user_id)
    if body.role_assigned not in ("reader", "editor"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Role assigne invalide. Seuls 'reader' et 'editor' sont autorises.")
    return create_cookbook_invitation(db, cookbook_id, body)


@router.get("/cookbooks/{cookbook_id}/invitations", response_model=list[CookbookInvitationRead])
def list_invitations(
    cookbook_id: UUID,
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    _ = _get_cookbook_or_404(db, cookbook_id)
    _require_owner(db, cookbook_id, current_user_id)
    return get_cookbook_invitations(db, cookbook_id, skip=skip, limit=limit)


@router.post("/invitations/{token}/accept")
def accept_invitation_route(
    token: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    invitation = get_cookbook_invitation_by_token(db, token)
    if not invitation:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invitation introuvable")
    if invitation.status != "pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "L'invitation n'est plus valide")
    if invitation.expires_at.replace(tzinfo=None) < datetime.utcnow():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "L'invitation a expire")
    if get_cookbook_member(db, invitation.cookbook_id, UUID(current_user_id)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Vous etes deja membre de ce cookbook")
    update_cookbook_invitation_status(db, invitation, "accepted")
    add_cookbook_member(db, invitation.cookbook_id, UUID(current_user_id), invitation.role_assigned)
    return {
        "detail": "Invitation acceptee",
        "cookbook_id": str(invitation.cookbook_id),
        "role_assigned": invitation.role_assigned,
    }


@router.post("/invitations/{token}/decline")
def decline_invitation_route(
    token: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id),
):
    invitation = get_cookbook_invitation_by_token(db, token)
    if not invitation:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invitation introuvable")
    if invitation.status != "pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "L'invitation n'est plus valide")
    update_cookbook_invitation_status(db, invitation, "declined")
    return {"detail": "Invitation declinee"}