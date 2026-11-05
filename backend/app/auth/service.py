from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.auth.models import User
from app.auth.schemas import RegisterRequest, LoginRequest
from app.core.security import password_hash, DUMMY_HASH


def register(db: Session, data: RegisterRequest) -> User:
    name = data.name.strip()
    if len(name) < 2:
        raise HTTPException(422, "Имя должно содержать не менее двух символов.")
    user = User(email=str(data.email).strip().lower(), name=name,
                password_hash=password_hash.hash(data.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Аккаунт с такой почтой уже существует.")
    db.refresh(user)
    return user


def login(db: Session, data: LoginRequest) -> User:
    user = db.scalar(select(User).where(User.email == str(data.email).strip().lower()))
    valid = password_hash.verify(data.password, user.password_hash if user else DUMMY_HASH)
    if not user or not valid:
        raise HTTPException(401, "Неверная почта или пароль.", headers={"WWW-Authenticate": "Bearer"})
    return user
