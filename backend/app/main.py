from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app import models  # noqa: F401 -- register all related SQLAlchemy models
from app.auth.router import router as auth_router
from app.subjects.router import router as subjects_router
from app.tasks.router import router as tasks_router
from app.core.config import get_settings
from app.core.dependencies import DB

app = FastAPI(title="Семестр API", version="1.0.0", description="Личный планировщик учебного семестра")
app.add_middleware(CORSMiddleware, allow_origins=get_settings().cors_origins,
                   allow_credentials=False, allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
                   allow_headers=["Authorization", "Content-Type"])


@app.exception_handler(RequestValidationError)
async def validation_error(_request, exc: RequestValidationError):
    # Do not echo request bodies: a failing registration may contain a password.
    return JSONResponse(status_code=422, content={
        "detail": "Проверьте обязательные поля, длину текста и формат значений.",
        "fields": [{"field": ".".join(str(x) for x in error["loc"]), "type": error["type"]}
                   for error in exc.errors()],
    })


@app.get("/api/health", tags=["Система"])
def health(db: DB):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


for router in [auth_router, subjects_router, tasks_router]:
    app.include_router(router, prefix="/api")
