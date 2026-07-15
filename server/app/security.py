from datetime import datetime, timedelta

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


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