"""Serve the built React client and the API on one origin for a live demonstration."""
from pathlib import Path

from starlette.exceptions import HTTPException
from starlette.responses import Response
from starlette.staticfiles import StaticFiles
from starlette.types import Scope

from app.main import app

DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


class SPAStaticFiles(StaticFiles):
    """Allow direct React Router URLs without masking API or asset errors."""

    async def get_response(self, path: str, scope: Scope) -> Response:
        is_document = path in {".", "", "index.html"} or path.endswith(".html")
        try:
            response = await super().get_response(path, scope)
        except HTTPException as exc:
            reserved = path == "api" or path.startswith("api/")
            hidden = any(part.startswith(".") for part in path.split("/"))
            if exc.status_code != 404 or reserved or hidden or Path(path).suffix:
                raise
            response = await super().get_response("index.html", scope)
            is_document = True
        if is_document or response.headers.get("content-type", "").startswith("text/html"):
            response.headers["cache-control"] = "no-store"
        return response


if not (DIST / "index.html").is_file():
    raise RuntimeError("Сначала соберите интерфейс командой npm run build из корня проекта")

app.mount("/", SPAStaticFiles(directory=DIST, html=True), name="web")
