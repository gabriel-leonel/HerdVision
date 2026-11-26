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

# Leituras e alertas de demonstração (animais 1 a 12 do seed do herd). Opt-in e idempotente:
# com o SQLite efêmero do Render, o banco volta a este estado a cada deploy.
if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
    php artisan db:seed --force
fi

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
