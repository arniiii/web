from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload
from app.subjects.models import Subject


def owned_subject(db: Session, subject_id: int, user_id: int) -> Subject:
    subject = db.scalar(select(Subject).where(Subject.id == subject_id, Subject.user_id == user_id)
                        .options(selectinload(Subject.tasks)))
    if subject is None:
        raise HTTPException(404, "Дисциплина не найдена.")
    return subject


def save(db: Session, subject: Subject) -> Subject:
    db.add(subject)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Дисциплина с таким названием уже существует.")
    db.refresh(subject)
    return subject
