from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

TaskStatus = Literal["todo", "in_progress", "done"]
TaskPriority = Literal["low", "medium", "high"]


class TaskWrite(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    title: str = Field(min_length=2, max_length=160)
    description: str = Field(default="", max_length=3000)
    subject_id: int = Field(gt=0)
    due_date: date
    status: TaskStatus = "todo"
    priority: TaskPriority = "medium"


class StatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: TaskStatus


class TaskOut(TaskWrite):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    subject_title: str
    subject_color: str
