import httpx
import logging

logger = logging.getLogger(__name__)

# Use HuggingFace Inference API for embeddings — zero local memory.
# Free tier, no API key required for light usage.
HF_API_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-small-en-v1.5"

_client = httpx.Client(timeout=60.0)

def embed_text(text: str) -> list:
    """Embed a single text string via HuggingFace API."""
    response = _client.post(HF_API_URL, json={"inputs": text, "options": {"wait_for_model": True}})
    response.raise_for_status()
    return response.json()

def embed_batch(chunks: list) -> list:
    """Embed a batch of chunks via HuggingFace API, processing in small batches."""
    texts = [chunk["text"] for chunk in chunks]

    # HF API accepts batched inputs — send in groups of 16
    all_vectors = []
    for i in range(0, len(texts), 16):
        batch = texts[i:i + 16]
        try:
            response = _client.post(
                HF_API_URL,
                json={"inputs": batch, "options": {"wait_for_model": True}},
                timeout=120.0,
            )
            response.raise_for_status()
            vectors = response.json()
            all_vectors.extend(vectors)
        except Exception as e:
            logger.error(f"Embedding batch {i}-{i+len(batch)} failed: {e}")
            # Fill with zero vectors so we don't break the pipeline
            all_vectors.extend([[0.0] * 384] * len(batch))

    for i, chunk in enumerate(chunks):
        chunk["embedding"] = all_vectors[i] if i < len(all_vectors) else [0.0] * 384
    return chunks
