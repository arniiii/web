from datetime import date
from typing import Annotated, Literal
from fastapi import APIRouter, Query, Response
from sqlalchemy import case
from app.core.dependencies import DB, CurrentUser
from app.subjects.service import owned_subject
from app.tasks.models import Task
from app.tasks.schemas import TaskWrite, TaskOut, StatusUpdate, TaskStatus, TaskPriority
from app.tasks.service import owned_task, owned_tasks

router = APIRouter(prefix="/tasks", tags=["Задания"])


@router.get("", response_model=list[TaskOut])
def list_tasks(
    db: DB, user: CurrentUser,
    search: Annotated[str, Query(max_length=160)] = "",
    subject_id: Annotated[int | None, Query(gt=0)] = None,
    status: TaskStatus | None = None,
    priority: TaskPriority | None = None,
    due_before: date | None = None,
    sort: Literal["due_date", "priority", "created_at"] = "due_date",
):
    query = owned_tasks(user.id)
    if search.strip():
        query = query.where(Task.title.icontains(search.strip(), autoescape=True))
    if subject_id is not None:
        query = query.where(Task.subject_id == subject_id)
    if status:
        query = query.where(Task.status == status)
    if priority:
        query = query.where(Task.priority == priority)
    if due_before:
        query = query.where(Task.due_date <= due_before)
    if sort == "priority":
        query = query.order_by(case((Task.priority == "high", 0), (Task.priority == "medium", 1), else_=2))
    elif sort == "created_at":
        query = query.order_by(Task.created_at.desc())
    return db.scalars(query.order_by(Task.due_date, Task.id)).all()


@router.post("", response_model=TaskOut, status_code=201)
def create_task(data: TaskWrite, db: DB, user: CurrentUser):
    subject = owned_subject(db, data.subject_id, user.id)
    task = Task(**data.model_dump())
    task.subject = subject
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: DB, user: CurrentUser):
    return owned_task(db, task_id, user.id)


@router.put("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, data: TaskWrite, db: DB, user: CurrentUser):
    task = owned_task(db, task_id, user.id)
    # Check BOTH the current owner and the target subject before changing a relation.
    subject = owned_subject(db, data.subject_id, user.id)
    for key, value in data.model_dump().items():
        setattr(task, key, value)
    task.subject = subject
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/status", response_model=TaskOut)
def update_status(task_id: int, data: StatusUpdate, db: DB, user: CurrentUser):
    task = owned_task(db, task_id, user.id)
    task.status = data.status
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: DB, user: CurrentUser) -> Response:
    task = owned_task(db, task_id, user.id)
    db.delete(task)
    db.commit()
    return Response(status_code=204)
