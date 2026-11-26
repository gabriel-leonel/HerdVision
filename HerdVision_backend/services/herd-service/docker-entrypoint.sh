#!/bin/sh
set -e

# Cria o banco SQLite (se ainda não existir) e aplica as migrations antes de
# subir o servidor. Para persistir os dados entre deploys no Render, monte um
# Persistent Disk e aponte DB_DATABASE para um arquivo dentro dele.
if [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
    DB_PATH="${DB_DATABASE:-/app/database/database.sqlite}"
    mkdir -p "$(dirname "$DB_PATH")"
    [ -f "$DB_PATH" ] || touch "$DB_PATH"
fi

php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
