# Размещение на VPS

Основной адрес: **https://185.11.247.232**. Приложение работает на сервере независимо от домашнего компьютера. HTTP перенаправляется на HTTPS.

На Ubuntu 24.04 установлены PostgreSQL 16, Nginx и Python 3.12. Nginx отдаёт собранный React-клиент и передаёт запросы `/api/` в FastAPI. API слушает только `127.0.0.1:8000`, PostgreSQL — локальный порт 5432. Docker и Node.js для работы готовой версии не нужны.

При переносе сохранены 3 аккаунта, 5 дисциплин и 10 заданий, включая прежние пароли аккаунтов в виде хешей. Демо-аккаунт остался прежним: `demo@semester.app` / `Semester2026!`.

## Файлы и службы

| Назначение | Расположение |
| --- | --- |
| Текущая версия | `/opt/semester/current` — ссылка на каталог в `/opt/semester/releases/` |
| Python-окружение API | `/opt/semester/venv` |
| Настройки и случайные ключи | `/etc/semester/app.env`, доступ только root и группе приложения |
| Настройки Nginx | `/etc/nginx/sites-available/semester` |
| Служба API | `semester.service`, отдельный системный пользователь `semester` |
| Проверка продления HTTPS | `semester-certbot.timer` и `semester-certbot.service` |
| Окружение Certbot | `/opt/semester/certbot`, Certbot 5.8.0 |
| Резервная копия после переноса | `/var/backups/semester/initial-20261106.dump` |

Конфигурации без секретов сохранены в `deploy/vps/`. При переносе на другой IP нужно заменить адрес в Nginx и `CORS_ORIGINS`, затем выпустить новый сертификат. Серверные ключи и SSH-пароль в Git не входят.

## Проверка и управление

Команды выполняются на VPS:

```bash
systemctl status semester nginx postgresql@16-main
systemctl list-timers semester-certbot.timer
journalctl -u semester -n 100 --no-pager
curl --fail https://185.11.247.232/api/health
```

Перезапуск API:

```bash
systemctl restart semester
```

Службы API, PostgreSQL, Nginx и таймер сертификата включены в автозапуск. При запуске API Alembic проверяет и применяет миграции. Данные находятся в PostgreSQL и не зависят от каталога текущей версии приложения.

## HTTPS

Используется доверенный сертификат Let's Encrypt для IP-адреса. Для таких сертификатов применяется короткий срок действия; таймер дважды в сутки проверяет необходимость продления. После успешного обновления Nginx перечитывает сертификат. Пробное продление с проверкой доступности сервера и запуском обработчика завершилось успешно.

Ручная проверка продления:

```bash
/opt/semester/certbot/bin/certbot renew --dry-run --no-random-sleep-on-renew --cert-name semester --run-deploy-hooks
```

Схема выпуска соответствует [инструкции Let's Encrypt для IP и Certbot](https://letsencrypt.org/2026/03/11/shorter-certs-certbot/).

## Обновление приложения

Интерфейс собирается на рабочем компьютере:

```bash
npm run build
git archive --format=tar --output=/tmp/semester-release.tar HEAD
tar --append --file=/tmp/semester-release.tar frontend/dist
gzip -f /tmp/semester-release.tar
scp /tmp/semester-release.tar.gz root@185.11.247.232:/root/
```

На сервере перед обновлением сохраните копию базы:

```bash
umask 077
runuser -u postgres -- pg_dump -Fc semester > "/var/backups/semester/before-update-$(date -u +%Y%m%d-%H%M%S).dump"
```

Затем подготовьте новую версию и переключите ссылку:

```bash
release_dir="/opt/semester/releases/$(date -u +%Y%m%d-%H%M%S)"
mkdir -p "$release_dir"
tar -xzf /root/semester-release.tar.gz -C "$release_dir"
/opt/semester/venv/bin/pip install -r "$release_dir/backend/requirements.txt"
ln -s "$release_dir" /opt/semester/next
mv -Tf /opt/semester/next /opt/semester/current
systemctl restart semester
nginx -t && systemctl reload nginx
curl --fail https://185.11.247.232/api/health
```

Файл `/etc/semester/app.env`, PostgreSQL и сертификаты при обновлении не заменяются. Если меняются конфигурации из `deploy/vps/`, их нужно отдельно установить в `/etc` и проверить перед перезапуском.

Прежняя ссылка через локальный Cloudflare-туннель остаётся отдельной копией приложения. После переноса используйте адрес VPS: дальнейшие изменения данных между двумя копиями автоматически не синхронизируются.
