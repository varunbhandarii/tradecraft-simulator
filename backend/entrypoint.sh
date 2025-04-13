#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run database migrations
# This command assumes Alembic is configured correctly and DATABASE_URL is set
echo "Running database migrations..."
alembic upgrade head

# Now, execute the command passed into the entrypoint (which will be the uvicorn command)
echo "Starting Uvicorn server..."
exec "$@"