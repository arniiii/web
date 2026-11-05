import pytest


def test_subject_crud_and_search(client, headers):
    created = client.post("/api/subjects", headers=headers, json={"title": "Базы данных", "teacher": "Преподаватель"})
    assert created.status_code == 201
    subject_id = created.json()["id"]
    assert created.json()["task_count"] == 0
    assert len(client.get("/api/subjects", params={"search": "базы"}, headers=headers).json()) == 1
    assert client.get(f"/api/subjects/{subject_id}", headers=headers).json()["teacher"] == "Преподаватель"
    update = client.put(f"/api/subjects/{subject_id}", headers=headers, json={"title": "SQL практика"})
    assert update.status_code == 200
    assert len(client.get("/api/subjects?search=SQL", headers=headers).json()) == 1
    assert client.get("/api/subjects?search=нет", headers=headers).json() == []
    assert client.delete(f"/api/subjects/{subject_id}", headers=headers).status_code == 204
    assert client.get(f"/api/subjects/{subject_id}", headers=headers).status_code == 404


@pytest.mark.parametrize("data", [{"title": " "}, {"title": "AB", "color": "red"}, {"title": "AB", "user_id": 8}])
def test_subject_validation(client, headers, data):
    assert client.post("/api/subjects", headers=headers, json=data).status_code == 422


def test_duplicates_and_nonempty_delete(client, headers, subject, task_payload):
    assert client.post("/api/subjects", headers=headers, json={"title": subject["title"]}).status_code == 409
    task = client.post("/api/tasks", headers=headers, json=task_payload)
    assert task.status_code == 201
    assert client.get(f"/api/subjects/{subject['id']}", headers=headers).json()["task_count"] == 1
    assert client.delete(f"/api/subjects/{subject['id']}", headers=headers).status_code == 409
    assert client.get(f"/api/tasks/{task.json()['id']}", headers=headers).status_code == 200


def test_search_wildcards_are_literal(client, headers):
    client.post("/api/subjects", headers=headers, json={"title": "100% практика"})
    client.post("/api/subjects", headers=headers, json={"title": "Другой предмет"})
    assert len(client.get("/api/subjects", params={"search": "%"}, headers=headers).json()) == 1
