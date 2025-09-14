# Backend Dockerfile for HMML2
# Multi-stage build: builder (optional for deps) + runtime

FROM python:3.11-slim AS base
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    POETRY_VIRTUALENVS_CREATE=false

# Set workdir
WORKDIR /app

# System deps (if future needs: build-essential) kept minimal
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy requirement file first for layer caching
COPY backend/requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY backend ./

# Create non-root user
RUN useradd -m hmml && chown -R hmml:hmml /app
USER hmml

EXPOSE 7999

# Healthcheck (FastAPI docs route or health route) - can be refined later
# HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
#   CMD curl -f http://localhost:7999/api/health || exit 1

CMD ["python", "start.py"]
