# Use official lightweight Python image
FROM python:3.11-slim

# Set environment variables
# Note: PORT is intentionally NOT set here — Render injects it at runtime.
# Setting it here could shadow Render's dynamic value.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install minimal OS dependencies for building Python wheels and curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency definition
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the fastembed ONNX model into the image cache.
# fastembed uses ONNX Runtime (no PyTorch) — ~80MB RAM vs ~400MB for sentence_transformers.
# BAAI/bge-small-en-v1.5 produces identical 384-dim vectors.
RUN python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='BAAI/bge-small-en-v1.5')"

# Copy application code
COPY . .

# Ensure upload directory exists
RUN mkdir -p uploads

# Render dynamically injects $PORT (default 10000).
# We EXPOSE 10000 as a hint, but the CMD always reads the runtime $PORT.
EXPOSE 10000

# Health check using runtime $PORT — Render probes /health after the port is bound
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT:-10000}/health || exit 1

# Start Uvicorn.
# All external clients (Groq, Supabase, Tavily) are now lazy-loaded,
# so uvicorn binds to $PORT immediately before any network I/O.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1"]
