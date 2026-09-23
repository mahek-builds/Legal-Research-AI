from fastembed import TextEmbedding
from app.config import settings

# Lazy model — only loaded on first embedding call.
# fastembed uses ONNX Runtime (no PyTorch), so memory footprint is ~50-80MB
# vs ~400MB for sentence_transformers + torch.
_model = None

def get_model():
    global _model
    if _model is None:
        _model = TextEmbedding(model_name=settings.EMBEDDING_MODEL)
    return _model

def embed_text(text: str) -> list:
    embeddings = list(get_model().embed([text]))
    return embeddings[0].tolist()

def embed_batch(chunks: list) -> list:
    texts = [chunk["text"] for chunk in chunks]
    vectors = list(get_model().embed(texts))
    for i, chunk in enumerate(chunks):
        chunk["embedding"] = vectors[i].tolist()
    return chunks
