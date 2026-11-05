from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.subjects.models import Subject
from app.tasks.models import Task


def owned_tasks(user_id: int):
    """All task reads and writes reach ownership through the linked subject."""
    return select(Task).join(Task.subject).where(Subject.user_id == user_id)


def owned_task(db: Session, task_id: int, user_id: int) -> Task:
    task = db.scalar(owned_tasks(user_id).where(Task.id == task_id))
    if task is None:
        raise HTTPException(404, "Задание не найдено.")
    return task
