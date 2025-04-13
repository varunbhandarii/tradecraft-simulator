#!/bin/sh
# Exit immediately if a command exits with a non-zero status.
set -e

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Get the port number from the environment variable injected by Cloud Run
# Default to 8000 if PORT isn't set (though Cloud Run usually sets it)
PORT_NUM=${PORT:-8000}

echo "Starting Uvicorn server on port $PORT_NUM..."
# Explicitly execute uvicorn using the value of PORT_NUM
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT_NUM"