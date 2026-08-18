#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

if [ "${RUN_SEED_ON_START:-false}" = "true" ]; then
    echo "Seeding baseline permissions/roles/admin user..."
    python -m app.seed
fi

exec "$@"
