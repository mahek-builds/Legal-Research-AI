import os
import logging
from fastembed import TextEmbedding

logger = logging.getLogger(__name__)

# Restrict ONNX/OpenMP thread counts to 1 to prevent memory spikes on low-RAM containers (e.g. Render 512MB)
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

_model = None

def get_embedding_model():
    global _model
    if _model is None:
        logger.info("Initializing FastEmbed BAAI/bge-small-en-v1.5 model...")
        _model = TextEmbedding(
            model_name="BAAI/bge-small-en-v1.5",
            threads=1
        )
    return _model

def embed_text(text: str) -> list[float]:
    """Embed a single text string locally using FastEmbed."""
    model = get_embedding_model()
    embeddings = list(model.embed([text]))
    vec = embeddings[0]
    return vec.tolist() if hasattr(vec, "tolist") else list(vec)

def embed_batch(chunks: list) -> list:
    """Embed a batch of text chunks locally using FastEmbed."""
    if not chunks:
        return chunks

    model = get_embedding_model()
    texts = [chunk["text"] for chunk in chunks]

    # FastEmbed embeds batches efficiently
    embeddings = list(model.embed(texts, batch_size=32))

    for i, chunk in enumerate(chunks):
        vec = embeddings[i]
        chunk["embedding"] = vec.tolist() if hasattr(vec, "tolist") else list(vec)

    return chunks
