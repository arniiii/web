from __future__ import annotations
from datetime import date, datetime
from typing import TYPE_CHECKING
from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
if TYPE_CHECKING:
    from app.subjects.models import Subject


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("status IN ('todo', 'in_progress', 'done')", name="ck_task_status"),
        CheckConstraint("priority IN ('low', 'medium', 'high')", name="ck_task_priority"),
        Index("ix_tasks_subject_due", "subject_id", "due_date"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="RESTRICT"))
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(String(3000), default="")
    due_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(16), default="todo")
    priority: Mapped[str] = mapped_column(String(10), default="medium")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    subject: Mapped[Subject] = relationship(back_populates="tasks", lazy="joined")

    @property
    def subject_title(self) -> str:
        return self.subject.title

    @property
    def subject_color(self) -> str:
        return self.subject.color
