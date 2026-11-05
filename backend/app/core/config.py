"""Read environment settings once; never commit a real JWT signing key."""
from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env", extra="ignore"
    )
    database_url: str = "postgresql+psycopg://semester:semester_local@127.0.0.1:55432/semester"
    jwt_secret: str = Field(min_length=32)
    access_token_expire_minutes: int = Field(default=120, ge=5, le=1440)
    cors_origins: list[str] = ["http://127.0.0.1:5173", "http://localhost:5173"]

    @field_validator("jwt_secret")
    @classmethod
    def real_secret(cls, value: str) -> str:
        if value.startswith("replace-with-"):
            raise ValueError("Задайте случайный JWT_SECRET или выполните npm run setup")
        return value

    @field_validator("database_url")
    @classmethod
    def postgres_only(cls, value: str) -> str:
        if not value.startswith("postgresql+psycopg://"):
            raise ValueError("Используйте PostgreSQL и драйвер psycopg")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
