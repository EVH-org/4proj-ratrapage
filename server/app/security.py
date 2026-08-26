from datetime import datetime, timedelta

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)

BCRYPT_ROUNDS = 12
MAX_PASSWORD_BYTES = 72


def hash_password(plain_password: str) -> str:
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > MAX_PASSWORD_BYTES:
        raise ValueError(f"Le mot de passe dépasse {MAX_PASSWORD_BYTES} octets")
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), password_hash.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


def _decode_jwt(token, settings):
    try:
        body = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
        )
    user_id = body.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
        )
    return user_id


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    if not settings.secret_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SECRET_KEY manquante",
        )
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expires_minutes)
    body = {"sub": user_id, "exp": expire}
    return jwt.encode(body, settings.secret_key, algorithm="HS256")


def get_user_id(
    auth: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    settings = get_settings()
    token = auth.credentials
    if not settings.secret_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SECRET_KEY manquante",
        )
    return _decode_jwt(token, settings)


def get_optional_user_id(
    auth: HTTPAuthorizationCredentials | None = Depends(security_optional),
) -> str | None:
    if not auth:
        return None
    settings = get_settings()
    token = auth.credentials
    if not settings.secret_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SECRET_KEY manquante",
        )
    return _decode_jwt(token, settings)