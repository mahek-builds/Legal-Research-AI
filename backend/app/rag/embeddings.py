from sentence_transformers import SentenceTransformer
from app.config import settings

model = SentenceTransformer(settings.EMBEDDING_MODEL)

def embed_text(text):
    return model.encode(text).tolist()

def embed_batch(chunks):
    texts = [chunk["text"] for chunk in chunks]
    vectors = model.encode(texts).tolist()
    for i, chunk in enumerate(chunks):
        chunk["embedding"] = vectors[i]
    return chunks
