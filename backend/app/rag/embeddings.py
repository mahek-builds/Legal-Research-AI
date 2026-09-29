import math
import hashlib
import re
import logging

logger = logging.getLogger(__name__)

# Lightweight, 0MB-RAM Feature-Hashing Vectorizer for Render free tier (512MB RAM).
# Produces 384-dimensional L2-normalized dense embeddings for Qdrant vector search.

EMBEDDING_DIM = 384

def _text_to_vector(text: str, dim: int = EMBEDDING_DIM) -> list[float]:
    """Convert text into a normalized dense embedding vector of length `dim`."""
    if not text or not text.strip():
        return [0.0] * dim

    text_lower = text.lower()
    words = re.findall(r'\w+', text_lower)
    if not words:
        return [0.0] * dim

    # Combine word tokens and 4-gram character subwords for rich matching
    ngrams = words + [text_lower[i:i+4] for i in range(len(text_lower) - 3)]

    vec = [0.0] * dim
    for term in ngrams:
        # MD5 hashing to bucket index
        idx = int(hashlib.md5(term.encode('utf-8')).hexdigest(), 16) % dim
        vec[idx] += 1.0

    # L2 normalize vector for Cosine Similarity search in Qdrant
    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]

    return vec

def get_embedding_model():
    return None

def embed_text(text: str) -> list[float]:
    """Embed a single text string."""
    return _text_to_vector(text)

def embed_batch(chunks: list) -> list:
    """Embed a list of chunk objects."""
    if not chunks:
        return chunks

    for chunk in chunks:
        text = chunk.get("text", "")
        chunk["embedding"] = _text_to_vector(text)

    return chunks
