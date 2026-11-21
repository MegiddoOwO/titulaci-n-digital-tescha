#!/usr/bin/env bash
# Local demo runner: user-space MariaDB + Laravel served with `php -S`.
# Usage: scripts/demo.sh up|share|down|status|reset-db --yes|test-db
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_DIR="${SCA_DB_DIR:-$HOME/.local/share/sca-mariadb}"
SOCK="$DB_DIR/mysqld.sock"
RUN="$DB_DIR/run"
PORT="${SCA_PORT:-8001}"
DB_NAME="${SCA_DB_NAME:-sca_tescha}"
mkdir -p "$RUN"

db() { mariadb --no-defaults -uroot --socket="$SOCK" "$@"; }
alive() { [[ -f "$RUN/$1.pid" ]] && kill -0 "$(<"$RUN/$1.pid")" 2>/dev/null; }

start_db() {
  if db -e "select 1" >/dev/null 2>&1; then echo "db: already running"; return; fi
  if [[ ! -d "$DB_DIR/data/mysql" ]]; then
    mariadb-install-db --no-defaults --datadir="$DB_DIR/data" \
      --auth-root-authentication-method=normal >/dev/null
  fi
  nohup mariadbd --no-defaults --datadir="$DB_DIR/data" --socket="$SOCK" \
    --port=3306 --bind-address=127.0.0.1 --pid-file="$DB_DIR/mysqld.pid" \
    >"$DB_DIR/mariadb.log" 2>&1 &
  for _ in $(seq 1 30); do db -e "select 1" >/dev/null 2>&1 && break; sleep 1; done
  db -e "select 1" >/dev/null 2>&1 || { echo "db: failed to start, see $DB_DIR/mariadb.log"; exit 1; }
  echo "db: started"
}

# Create the database and load schema + demo data through Laravel migrations/seeders.
build_database() {
  db -e "create database if not exists \`$DB_NAME\` character set utf8mb4 collate utf8mb4_unicode_ci"
  (cd "$ROOT" && DB_DATABASE="$DB_NAME" php artisan migrate --seed --force)
  echo "db: $DB_NAME migrated and seeded"
}

start_laravel() {
  if alive laravel; then echo "laravel: already running"; return; fi
  (cd "$ROOT" && npm run build >"$RUN/build.log" 2>&1) \
    || { echo "laravel: npm run build failed, see $RUN/build.log"; exit 1; }
  # Like `artisan serve`: the router script resolves index.php from the working
  # directory, so the server must run from public/.
  cd "$ROOT/public"
  # The pid recorded is php's own: `&` must apply to the php command alone.
  nohup php -d upload_max_filesize=25M -d post_max_size=30M \
    -S "127.0.0.1:$PORT" \
    "$ROOT/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php" \
    >"$RUN/laravel.log" 2>&1 &
  echo $! >"$RUN/laravel.pid"
  sleep 2
  if app_ok; then
    echo "laravel: started on http://127.0.0.1:$PORT (log: $RUN/laravel.log)"
  else
    echo "laravel: started but the app does not render, see $RUN/laravel.log"
    exit 1
  fi
}

# True only if the login page really renders (an HTTP 200 alone can hide a PHP fatal error).
app_ok() {
  local body
  body="$(curl -fs "http://127.0.0.1:$PORT/login" 2>/dev/null || true)"
  [[ "$body" == *"data-page"* && "$body" != *"Fatal error"* ]]
}

stop_laravel() {
  local pid=""
  if alive laravel; then
    pid="$(<"$RUN/laravel.pid")"
  else
    # Fallback: whoever listens on our port, only if it is a `php -S` on that port.
    local cand
    cand="$(ss -ltnpH "sport = :$PORT" 2>/dev/null | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)"
    if [[ -n "$cand" ]] && ps -o args= -p "$cand" 2>/dev/null | grep -q -- "-S 127.0.0.1:$PORT"; then
      pid="$cand"
    fi
  fi
  if [[ -n "$pid" ]]; then kill "$pid" 2>/dev/null || true; echo "laravel: stopped"; fi
  rm -f "$RUN/laravel.pid"
}

case "${1:-}" in
  up)
    start_db
    db -e "use \`$DB_NAME\`" 2>/dev/null || build_database
    # Apply migrations added after the demo database was first built.
    (cd "$ROOT" && DB_DATABASE="$DB_NAME" php artisan migrate --force)
    start_laravel
    echo "Open http://127.0.0.1:$PORT  (password for all demo users: Demo1234!)"
    echo "  estudiante 2021-0001 | asesor DOC-0001 | administrativo ADM-0001"
    ;;
  share)
    # Start everything, then expose the app through a free Cloudflare quick tunnel.
    # The public URL changes on every run; Ctrl+C closes the tunnel (the app keeps running).
    command -v cloudflared >/dev/null || { echo "cloudflared is not installed"; exit 1; }
    "$0" up
    echo "Opening the tunnel: look for the https://...trycloudflare.com URL below. Ctrl+C to close it."
    cloudflared tunnel --url "http://127.0.0.1:$PORT"
    ;;
  down)
    stop_laravel
    db -e "shutdown" 2>/dev/null && echo "db: stopped" || true
    ;;
  status)
    db -e "select 1" >/dev/null 2>&1 && echo "db: up" || echo "db: down"
    app_ok && echo "laravel: up" || echo "laravel: down (or not rendering)"
    ;;
  reset-db)
    if [[ "${2:-}" != "--yes" ]]; then
      echo "reset-db drops and recreates the \`$DB_NAME\` database (all demo data). Re-run with --yes."
      exit 1
    fi
    start_db
    db -e "drop database if exists \`$DB_NAME\`"
    build_database
    ;;
  test-db)
    start_db
    db -e "create database if not exists sca_tescha_test character set utf8mb4 collate utf8mb4_unicode_ci"
    (cd "$ROOT" && DB_DATABASE=sca_tescha_test php artisan sca:test-db)
    ;;
  *) echo "Usage: $0 up|share|down|status|reset-db --yes|test-db"; exit 1 ;;
esac
