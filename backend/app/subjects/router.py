from typing import Annotated
from fastapi import APIRouter, HTTPException, Query, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from app.core.dependencies import DB, CurrentUser
from app.subjects.models import Subject
from app.subjects.schemas import SubjectWrite, SubjectOut
from app.subjects.service import owned_subject, save

router = APIRouter(prefix="/subjects", tags=["Дисциплины"])


@router.get("", response_model=list[SubjectOut])
def list_subjects(db: DB, user: CurrentUser, search: Annotated[str, Query(max_length=120)] = ""):
    query = select(Subject).where(Subject.user_id == user.id).options(selectinload(Subject.tasks))
    if search.strip():
        query = query.where(Subject.title.collate("und-x-icu").icontains(search.strip(), autoescape=True))
    return db.scalars(query.order_by(Subject.created_at, Subject.id)).all()


@router.post("", response_model=SubjectOut, status_code=201)
def create_subject(data: SubjectWrite, db: DB, user: CurrentUser):
    return save(db, Subject(user_id=user.id, **data.model_dump()))


@router.get("/{subject_id}", response_model=SubjectOut)
def get_subject(subject_id: int, db: DB, user: CurrentUser):
    return owned_subject(db, subject_id, user.id)


@router.put("/{subject_id}", response_model=SubjectOut)
def update_subject(subject_id: int, data: SubjectWrite, db: DB, user: CurrentUser):
    subject = owned_subject(db, subject_id, user.id)
    for key, value in data.model_dump().items():
        setattr(subject, key, value)
    return save(db, subject)


@router.delete("/{subject_id}", status_code=204)
def delete_subject(subject_id: int, db: DB, user: CurrentUser) -> Response:
    subject = owned_subject(db, subject_id, user.id)
    if subject.tasks:
        raise HTTPException(409, "Сначала удалите задания дисциплины или перенесите их в другую.")
    db.delete(subject)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "В дисциплине появились задания. Обновите страницу.")
    return Response(status_code=204)
