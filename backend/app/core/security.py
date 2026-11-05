"""Argon2 hashes and short-lived, signed JWT access tokens."""
from datetime import datetime, timedelta, timezone
import jwt
from pwdlib import PasswordHash
from app.core.config import get_settings

password_hash = PasswordHash.recommended()
# A valid hash equalizes the work for known and unknown account login attempts.
DUMMY_HASH = password_hash.hash("dummy-password-for-timing-only")


def create_access_token(user_id: int) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    return jwt.encode({
        "sub": str(user_id), "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }, settings.jwt_secret, algorithm="HS256")
