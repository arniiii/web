from fastapi import APIRouter
from app.auth import service
from app.auth.schemas import AuthResponse, RegisterRequest, LoginRequest, ProfileUpdate, UserOut
from app.core.dependencies import DB, CurrentUser
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Аккаунт"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(data: RegisterRequest, db: DB) -> AuthResponse:
    user = service.register(db, data)
    return AuthResponse(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: DB) -> AuthResponse:
    user = service.login(db, data)
    return AuthResponse(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user


@router.put("/me", response_model=UserOut)
def update_profile(data: ProfileUpdate, db: DB, user: CurrentUser):
    for key, value in data.model_dump().items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user
