"""Shared dependencies: authentication is always checked on the API server."""
from typing import Annotated
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.auth.models import User
from app.core.config import get_settings
from app.core.database import get_db

DB = Annotated[Session, Depends(get_db)]
bearer = HTTPBearer(auto_error=False)


def current_user(
    db: DB,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> User:
    error = HTTPException(401, "Войдите в аккаунт: сессия отсутствует или истекла.",
                          headers={"WWW-Authenticate": "Bearer"})
    if credentials is None:
        raise error
    try:
        payload = jwt.decode(credentials.credentials, get_settings().jwt_secret,
                             algorithms=["HS256"], options={"require": ["exp", "sub", "iat"]})
        user_id = int(payload["sub"])
        if user_id <= 0:
            raise ValueError("Invalid user id")
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise error
    user = db.get(User, user_id)
    if user is None:
        raise error
    return user


CurrentUser = Annotated[User, Depends(current_user)]
