#!/usr/bin/env bash
# Local demo runner: user-space MariaDB + Express API + Vite frontend.
# Usage: scripts/demo.sh up|down|status|reset-db
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_DIR="${SCA_DB_DIR:-$HOME/.local/share/sca-mariadb}"
SOCK="$DB_DIR/mysqld.sock"
RUN="$DB_DIR/run"
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

load_schema() {
  db < "$ROOT/database/schema.sql"
  db < "$ROOT/database/seed.sql"
  echo "db: schema and seed loaded"
}

start_app() { # name dir
  if alive "$1"; then echo "$1: already running"; return; fi
  (cd "$2" && nohup npm run dev >"$RUN/$1.log" 2>&1 & echo $! >"$RUN/$1.pid")
  echo "$1: started (log: $RUN/$1.log)"
}

stop_app() {
  if alive "$1"; then
    # npm spawns children; kill the whole process group
    kill -- "-$(ps -o pgid= "$(<"$RUN/$1.pid")" | tr -d ' ')" 2>/dev/null || kill "$(<"$RUN/$1.pid")" || true
    echo "$1: stopped"
  fi
  rm -f "$RUN/$1.pid"
}

case "${1:-}" in
  up)
    start_db
    db -e "use sca_tescha" 2>/dev/null || load_schema
    start_app api "$ROOT/server"
    start_app web "$ROOT"
    sleep 6
    echo "Open http://localhost:8080  (password for all demo users: Demo1234!)"
    echo "  estudiante 2021-0001 | asesor DOC-0001 | administrativo ADM-0001"
    ;;
  down)
    stop_app web
    stop_app api
    db -e "shutdown" 2>/dev/null && echo "db: stopped" || true
    ;;
  status)
    db -e "select 1" >/dev/null 2>&1 && echo "db: up" || echo "db: down"
    curl -fs localhost:3000/api/health >/dev/null && echo "api: up" || echo "api: down"
    curl -fs -o /dev/null localhost:8080 && echo "web: up" || echo "web: down"
    ;;
  reset-db)
    start_db
    db -e "drop database if exists sca_tescha"
    load_schema
    ;;
  *) echo "Usage: $0 up|down|status|reset-db"; exit 1 ;;
esac
