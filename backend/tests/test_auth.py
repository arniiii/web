from datetime import datetime, timedelta, timezone
import jwt
import pytest
from sqlalchemy import select
from app.auth.models import User
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.security import password_hash


def test_registration_login_hash_and_profile(client):
    data = {"email": "Student@Example.com", "name": "Студент", "password": "StrongPass2026!"}
    result = client.post("/api/auth/register", json=data)
    assert result.status_code == 201
    assert "password" not in result.text
    assert "password_hash" not in result.text
    token = result.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/auth/me", headers=headers).json()["email"] == "student@example.com"
    assert client.post("/api/auth/login", json={"email": "STUDENT@example.com", "password": data["password"]}).status_code == 200
    assert client.post("/api/auth/register", json=data).status_code == 409
    assert client.post("/api/auth/login", json={"email": data["email"], "password": "wrong"}).status_code == 401
    with SessionLocal() as db:
        user = db.scalar(select(User))
        assert user.password_hash != data["password"]
        assert user.password_hash.startswith("$argon2id$")
        assert password_hash.verify(data["password"], user.password_hash)
    updated = client.put("/api/auth/me", headers=headers, json={"name": "Новое имя", "study_group": "БПИ-31", "university": "ТГТУ"})
    assert updated.status_code == 200
    assert client.get("/api/auth/me", headers=headers).json()["name"] == "Новое имя"


@pytest.mark.parametrize("path", ["/api/auth/me", "/api/subjects", "/api/tasks", "/api/tasks/1"])
def test_missing_token_is_401(client, path):
    response = client.get(path)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize("kind", ["garbage", "expired", "wrong_secret", "wrong_algorithm", "missing_exp", "bad_subject", "missing_user"])
def test_invalid_tokens(client, headers, kind):
    now = datetime.now(timezone.utc)
    payload = {"sub": "1", "iat": now, "exp": now + timedelta(hours=1)}
    secret = get_settings().jwt_secret
    algorithm = "HS256"
    if kind == "expired": payload["exp"] = now - timedelta(seconds=1)
    if kind == "wrong_secret": secret = "another-random-key-that-is-long-enough"
    if kind == "wrong_algorithm": algorithm = "HS384"
    if kind == "missing_exp": payload.pop("exp")
    if kind == "bad_subject": payload["sub"] = "not-a-number"
    if kind == "missing_user": payload["sub"] = "999999"
    token = "broken.token" if kind == "garbage" else jwt.encode(payload, secret, algorithm=algorithm)
    assert client.get("/api/tasks", headers={"Authorization": f"Bearer {token}"}).status_code == 401


@pytest.mark.parametrize("patch", [{"name": " "}, {"email": "invalid"}, {"password": "short"}])
def test_registration_validation(client, patch):
    data = {"email": "person@example.com", "name": "Студент", "password": "StrongPass2026!"} | patch
    response = client.post("/api/auth/register", json=data)
    assert response.status_code == 422
    assert "StrongPass2026" not in response.text
