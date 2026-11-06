"""Test the built frontend alongside the real API on a single HTTP origin."""
import pytest
from fastapi.testclient import TestClient
from app.demo import app


@pytest.mark.parametrize("path", ["/", "/login", "/register", "/subjects/42", "/tasks/new", "/profile"])
def test_react_routes_open_directly(path):
    with TestClient(app) as client:
        response = client.get(path)
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/html")
        assert '<div id="root">' in response.text
        assert response.headers["cache-control"] == "no-store"


def test_cached_html_still_disables_caching():
    with TestClient(app) as client:
        response = client.get("/register")
        cached = client.get("/register", headers={"If-None-Match": response.headers["etag"]})
        assert cached.status_code == 304
        assert cached.headers["cache-control"] == "no-store"


def test_initial_html_and_startup_script_can_recover_from_failed_loading():
    with TestClient(app) as client:
        response = client.get("/register")
        assert "Открываем учебный план" in response.text
        assert '<noscript' in response.text
        assert response.text.index('id="startup-guard"') < response.text.index('type="module"')
        assert "Не удалось загрузить приложение" in response.text


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
