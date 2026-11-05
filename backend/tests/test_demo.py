"""Test the built frontend alongside the real API on a single HTTP origin."""
import pytest
from fastapi.testclient import TestClient
from app.demo import app


@pytest.mark.parametrize("path", ["/", "/login", "/subjects/42", "/tasks/new", "/profile"])
def test_react_routes_open_directly(path):
    with TestClient(app) as client:
        response = client.get(path)
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/html")
        assert '<div id="root">' in response.text


@pytest.mark.parametrize("path", ["/api/missing", "/assets/missing.js", "/.env"])
def test_missing_api_and_files_are_not_spa_html(path):
    with TestClient(app) as client:
        response = client.get(path)
        assert response.status_code == 404
        assert '<div id="root">' not in response.text


def test_demo_keeps_api_authorization():
    with TestClient(app) as client:
        assert client.get("/api/tasks").status_code == 401
        assert client.get("/api/health").json() == {"status": "ok"}
