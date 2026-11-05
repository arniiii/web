from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class SubjectWrite(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    title: str = Field(min_length=2, max_length=120)
    teacher: str = Field(default="", max_length=120)
    color: str = Field(default="#4c7666", pattern=r"^#[0-9a-fA-F]{6}$")
    description: str = Field(default="", max_length=1000)


class SubjectOut(SubjectWrite):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    task_count: int
    completed_count: int
