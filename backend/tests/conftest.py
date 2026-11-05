"""Integration tests run only in a separate PostgreSQL database ending in _test."""
import os
from pathlib import Path
import pytest
from dotenv import dotenv_values
from sqlalchemy.engine import make_url

backend = Path(__file__).resolve().parents[1]
values = dotenv_values(backend / ".env")
test_url = os.getenv("TEST_DATABASE_URL") or values.get("TEST_DATABASE_URL")
if not test_url or not make_url(test_url).database.endswith("_test"):
    raise RuntimeError("Set TEST_DATABASE_URL to a dedicated PostgreSQL database ending in _test")
os.environ["DATABASE_URL"] = test_url

from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.core.database import engine
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def migrated_database():
    config = Config(str(backend / "alembic.ini"))
    command.upgrade(config, "head")
    yield
    engine.dispose()


@pytest.fixture(autouse=True)
def clear_database(migrated_database):
    with engine.begin() as connection:
        connection.execute(text("TRUNCATE tasks, subjects, users RESTART IDENTITY CASCADE"))
    yield


@pytest.fixture
def client():
    with TestClient(app) as client:
        yield client


@pytest.fixture
def account(client):
    def create(email="student@example.com"):
        response = client.post("/api/auth/register", json={"email": email, "name": "Студент", "password": "StudentPass2026!"})
        assert response.status_code == 201, response.text
        body = response.json()
        return {"Authorization": f"Bearer {body['access_token']}"}
    return create


@pytest.fixture
def headers(account):
    return account()


@pytest.fixture
def subject(client, headers):
    response = client.post("/api/subjects", headers=headers, json={"title": "Веб-программирование", "color": "#4c7666"})
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
def task_payload(subject):
    return {"title": "Курсовая работа", "subject_id": subject["id"], "due_date": "2026-12-15", "priority": "high"}
