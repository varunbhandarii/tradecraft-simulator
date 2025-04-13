# Choose a suitable Python base image (match your development environment if possible)
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install Python dependencies
# Upgrade pip first
RUN pip install --no-cache-dir --upgrade pip
# Copy only the requirements file first to leverage Docker cache
COPY requirements.txt .
# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy Alembic configuration
COPY alembic.ini alembic.ini
COPY alembic /app/alembic

# Copy the application code into the container
# Copy the 'app' directory where main.py and submodules are located
COPY ./app /app/app
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
# Expose the port the app runs on
EXPOSE 8000
ENTRYPOINT ["/app/entrypoint.sh"]
# Define the command to run the application
# Use 0.0.0.0 to allow connections from outside the container within Docker network
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]