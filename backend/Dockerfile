FROM python:3.12-slim

# Keep the backend files in a predictable container path.
WORKDIR /app

# Python logs should appear immediately in Docker.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# libpq lets psycopg2 talk to PostgreSQL.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies before copying app code for better caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the FastAPI source code.
COPY app ./app

# FastAPI listens on port 8000 inside the container.
EXPOSE 8000

# Start the production API server.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
