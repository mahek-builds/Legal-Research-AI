from sentence_transformers import SentenceTransformer
from app.config import settings

model = None

def get_model():
    global model
    if model is None:
        model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return model

def embed_text(text):
    return get_model().encode(text).tolist()

def embed_batch(chunks):
    texts = [chunk["text"] for chunk in chunks]
    vectors = get_model().encode(texts).tolist()
    for i, chunk in enumerate(chunks):
        chunk["embedding"] = vectors[i]
    return chunks
