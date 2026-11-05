"""Install and control user-owned background services for the coursework demo.

The project, PostgreSQL and HTTPS tunnel survive closing terminals and the chat.
No deadline is configured: stop explicitly after the demonstration.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import re
import shlex
import shutil
import signal
import subprocess
import sys
import time
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".local" / "hosting"
TARGET = "semester-demo.target"
UNITS = ["semester-demo-db.service", "semester-demo-app.service", "semester-demo-tunnel.service"]


def systemctl(*arguments: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(["systemctl", "--user", *arguments], check=check)


def wait_for(kind: str) -> None:
    """A service becomes ready only after its DB query / HTTP health check succeeds."""
    deadline = time.monotonic() + 60
    engine = None
    if kind == "db":
        sys.path.insert(0, str(ROOT / "backend"))
        from sqlalchemy import create_engine, text
        from sqlalchemy.pool import NullPool
        from app.core.config import get_settings
        engine = create_engine(get_settings().database_url, poolclass=NullPool)
    while time.monotonic() < deadline:
        try:
            if engine is not None:
                with engine.connect() as connection:
                    connection.execute(text("SELECT 1"))
                engine.dispose()
            else:
                with urlopen("http://127.0.0.1:8080/api/health", timeout=2) as response:
                    if response.status != 200:
                        raise RuntimeError("Health check failed")
            return
        except Exception:
            time.sleep(0.5)
    raise SystemExit(f"Служба {kind} не стала готова за 60 секунд")


def tunnel() -> None:
    """Keep the current public URL on disk; reconnects stay within cloudflared."""
    STATE.mkdir(parents=True, exist_ok=True)
    (STATE / "url.txt").unlink(missing_ok=True)
    process = subprocess.Popen([
        str(ROOT / ".local/bin/cloudflared"), "tunnel", "--no-autoupdate",
        "--protocol", "http2", "--metrics", "127.0.0.1:20241",
        "--url", "http://127.0.0.1:8080",
    ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)

    def stop(_signum, _frame):
        process.terminate()

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    assert process.stdout is not None
    for line in process.stdout:
        print(line, end="", flush=True)
        match = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", line)
        if match:
            temporary = STATE / "url.tmp"
            temporary.write_text(match.group(0) + "\n")
            temporary.replace(STATE / "url.txt")
    raise SystemExit(process.wait())


def install() -> None:
    if not (ROOT / ".local/bin/cloudflared").is_file():
        raise SystemExit("Установите официальный cloudflared в .local/bin/cloudflared")
    if not (ROOT / "frontend/dist/index.html").is_file():
        raise SystemExit("Сначала выполните npm run build")
    python = ROOT / "backend/.venv/bin/python"
    node = shutil.which("node")
    if not python.is_file() or not node:
        raise SystemExit("Нужны Node.js и backend/.venv; выполните настройку из README")
    STATE.mkdir(parents=True, exist_ok=True)
    destination = Path.home() / ".config/systemd/user"
    destination.mkdir(parents=True, exist_ok=True)

    def arg(value: str | Path) -> str:
        return shlex.quote(str(value)).replace("%", "%%")

    root = arg(ROOT)
    py = arg(python)
    script = arg(Path(__file__).resolve())
    common = f"""WorkingDirectory={root}
Restart=always
RestartSec=5
TimeoutStopSec=30
KillMode=mixed
UMask=0077
Environment=PYTHONUNBUFFERED=1
"""
    units = {
        "semester-demo-db.service": f"""[Unit]
Description=Semester planner PostgreSQL
PartOf={TARGET}

[Service]
Type=exec
{common}ExecStart={arg(node)} scripts/dev-db.mjs
ExecStartPost={py} {script} wait-db
""",
        "semester-demo-app.service": f"""[Unit]
Description=Semester planner application
Wants=semester-demo-db.service
After=semester-demo-db.service
PartOf={TARGET}

[Service]
Type=exec
{common}ExecStartPre={py} -m alembic -c backend/alembic.ini upgrade head
ExecStart={py} -m uvicorn app.demo:app --app-dir backend --host 127.0.0.1 --port 8080 --proxy-headers --forwarded-allow-ips=127.0.0.1
ExecStartPost={py} {script} wait-http
""",
        "semester-demo-tunnel.service": f"""[Unit]
Description=Semester planner HTTPS demonstration link
Wants=semester-demo-app.service
After=semester-demo-app.service
PartOf={TARGET}

[Service]
Type=exec
{common}ExecStartPre={py} {script} wait-http
ExecStart={py} {script} tunnel
""",
        TARGET: f"""[Unit]
Description=Semester planner live demonstration
Wants={' '.join(UNITS)}

[Install]
WantedBy=default.target
""",
    }
    for name, content in units.items():
        (destination / name).write_text(content)
    systemctl("daemon-reload")
    systemctl("enable", "--now", TARGET)
    print("Фоновые службы установлены. Автоматического срока отключения нет.")
    print("Проверка: npm run demo:status. Остановка: npm run demo:stop")


def status() -> None:
    systemctl("is-active", *UNITS, check=False)
    url = STATE / "url.txt"
    if url.is_file():
        print("Публичная ссылка:", url.read_text().strip())
    else:
        print("Ссылка ещё не получена. Лог: journalctl --user -u semester-demo-tunnel -n 40")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["install", "start", "stop", "status", "tunnel", "wait-db", "wait-http"])
    action = parser.parse_args().action
    if action == "install":
        install()
    elif action == "start":
        systemctl("enable", "--now", TARGET)
    elif action == "stop":
        systemctl("disable", "--now", TARGET)
        (STATE / "url.txt").unlink(missing_ok=True)
        print("Приложение, туннель и БД остановлены. Данные сохранены.")
    elif action == "status":
        status()
    elif action == "tunnel":
        tunnel()
    else:
        wait_for("db" if action == "wait-db" else "http")


if __name__ == "__main__":
    main()
