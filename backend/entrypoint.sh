#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

if [ "$SEED_DATA" = "true" ]; then
    echo "Seeding data..."
    python seed_data.py
fi

echo "Starting Gunicorn..."
exec gunicorn nexus.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers ${GUNICORN_WORKERS:-4} \
    --threads ${GUNICORN_THREADS:-2} \
    --worker-class ${GUNICORN_WORKER_CLASS:-sync} \
    --timeout ${GUNICORN_TIMEOUT:-120} \
    --access-logfile - \
    --error-logfile -
