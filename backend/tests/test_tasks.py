import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_task_lifecycle_and_persistence(client, headers, task_payload, subject):
    response = client.post("/api/tasks", headers=headers, json=task_payload)
    assert response.status_code == 201, response.text
    task_id = response.json()["id"]
    assert response.json()["subject_title"] == subject["title"]
    # A different app client opens a new DB session; no in-memory task repository.
    with TestClient(app) as second_client:
        assert second_client.get(f"/api/tasks/{task_id}", headers=headers).json()["title"] == task_payload["title"]
    result = client.put(f"/api/tasks/{task_id}", headers=headers, json=task_payload | {"title": "Новое название", "description": "Подробности"})
    assert result.status_code == 200
    assert result.json()["description"] == "Подробности"
    assert client.patch(f"/api/tasks/{task_id}/status", headers=headers, json={"status": "done"}).status_code == 200
    assert client.get(f"/api/subjects/{subject['id']}", headers=headers).json()["completed_count"] == 1
    assert client.delete(f"/api/tasks/{task_id}", headers=headers).status_code == 204
    assert client.get(f"/api/tasks/{task_id}", headers=headers).status_code == 404
    assert client.delete(f"/api/subjects/{subject['id']}", headers=headers).status_code == 204


def test_ownership_on_all_operations(client, headers, account, subject, task_payload):
    task = client.post("/api/tasks", headers=headers, json=task_payload).json()
    other = account("other@example.com")
    foreign = client.post("/api/subjects", headers=other, json={"title": "Чужой предмет"}).json()
    assert client.get("/api/subjects", headers=other).json()[0]["id"] == foreign["id"]
    assert client.get("/api/tasks", headers=other).json() == []
    for path in [f"/api/subjects/{subject['id']}", f"/api/tasks/{task['id']}"]:
        assert client.get(path, headers=other).status_code == 404
        assert client.delete(path, headers=other).status_code == 404
    assert client.put(f"/api/subjects/{subject['id']}", headers=other, json={"title": "Взлом"}).status_code == 404
    assert client.put(f"/api/tasks/{task['id']}", headers=other, json=task_payload).status_code == 404
    assert client.patch(f"/api/tasks/{task['id']}/status", headers=other, json={"status": "done"}).status_code == 404
    assert client.post("/api/tasks", headers=other, json=task_payload).status_code == 404
    # The owner may not move their own task to someone else's subject either.
    assert client.put(f"/api/tasks/{task['id']}", headers=headers, json=task_payload | {"subject_id": foreign["id"]}).status_code == 404
    assert client.get(f"/api/tasks/{task['id']}", headers=headers).json()["subject_id"] == subject["id"]


@pytest.mark.parametrize("patch", [{"title": " "}, {"due_date": "bad-date"}, {"priority": "urgent"}, {"status": "secret"}, {"subject_id": 0}, {"user_id": 2}])
def test_task_validation(client, headers, task_payload, patch):
    assert client.post("/api/tasks", headers=headers, json=task_payload | patch).status_code == 422


def test_search_filters_and_sorting(client, headers, task_payload):
    for title, due, status, priority in [
        ("React API", "2026-12-10", "todo", "low"),
        ("React forms", "2026-12-11", "done", "high"),
        ("SQL миграции", "2026-12-12", "in_progress", "medium"),
    ]:
        assert client.post("/api/tasks", headers=headers, json=task_payload | {"title": title, "due_date": due, "status": status, "priority": priority}).status_code == 201
    def query(**params): return client.get("/api/tasks", headers=headers, params=params).json()
    assert len(query(search="react")) == 2
    assert len(query(search="МИГРАЦИИ")) == 1
    assert len(query(status="done")) == 1
    assert len(query(priority="medium")) == 1
    assert len(query(due_before="2026-12-11")) == 2
    assert len(query(due_after="2026-12-11", pending="true")) == 1
    assert len(query(subject_id=999999)) == 0
    assert [row["priority"] for row in query(sort="priority")] == ["high", "medium", "low"]
