"""Create an isolated Python environment and a local secret without overwriting settings."""
from pathlib import Path
import secrets
import subprocess
import venv
import sys

root = Path(__file__).resolve().parents[1]
backend = root / "backend"
env = backend / ".env"
if not env.exists():
    env.write_text((backend / ".env.example").read_text().replace(
        "replace-with-a-random-secret-at-least-32-characters", secrets.token_hex(32)
    ))
    env.chmod(0o600)
if "--env-only" in sys.argv:
    print("Локальный файл backend/.env готов.")
    raise SystemExit(0)
if not (backend / ".venv").exists():
    venv.create(backend / ".venv", with_pip=True)
requirements = backend / "requirements.txt"
if not requirements.exists():
    requirements = backend / "requirements.in"
subprocess.run([str(backend / ".venv/bin/python"), "-m", "pip", "install", "-r", str(requirements)], check=True)
print("Готово. Запустите БД, примените миграции и запустите API и интерфейс по README.")
