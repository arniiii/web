"""Explicit model registry used by Alembic; tables are created only by migrations."""
from app.auth.models import User
from app.subjects.models import Subject
from app.tasks.models import Task

__all__ = ["User", "Subject", "Task"]
