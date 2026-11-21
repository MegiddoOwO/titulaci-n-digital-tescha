#!/usr/bin/env bash
# Waits for the database, migrates, seeds demo data on first run, then serves the app.
set -euo pipefail
cd /var/www/html

if [[ -z "${APP_KEY:-}" ]]; then
  APP_KEY="$(php artisan key:generate --show)"
  export APP_KEY
fi

echo "app: waiting for the database..."
for _ in $(seq 1 60); do
  php artisan migrate --force >/dev/null 2>&1 && break
  sleep 2
done
php artisan migrate --force

users="$(php artisan tinker --execute='echo DB::table("usuarios")->count();' 2>/dev/null | tail -1 | tr -dc '0-9')"
if [[ "${users:-0}" == "0" ]]; then
  echo "app: empty database, loading demo data"
  php artisan db:seed --force
fi

php artisan storage:link >/dev/null 2>&1 || true

echo "app: ready on http://127.0.0.1:${SCA_PORT:-8001}  (password for all demo users: Demo1234!)"
echo "  estudiante 2021-0001 | asesor DOC-0001 | administrativo ADM-0001"

# Run from public/ with Laravel's router script, like `artisan serve`.
cd public
exec php -d upload_max_filesize=25M -d post_max_size=30M \
  -S "0.0.0.0:8001" \
  /var/www/html/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php
