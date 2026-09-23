from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from app.rag.embeddings import embed_text
import uuid
import logging

logger = logging.getLogger(__name__)

client = QdrantClient(":memory:")
COLLECTION = "legal_documents"

def _ensure_collection():
    try:
        collections = client.get_collections().collections
        exists = any(c.name == COLLECTION for c in collections)
        if not exists:
            client.create_collection(
                collection_name=COLLECTION,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )
    except Exception:
        try:
            client.create_collection(
                collection_name=COLLECTION,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )
        except Exception:
            pass

_ensure_collection()

def store_chunks(chunks):
    if not chunks:
        return
    _ensure_collection()
    points = []
    for chunk in chunks:
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=chunk["embedding"],
            payload={
                "chunk_id": chunk["chunk_id"],
                "document_id": chunk["document_id"],
                "document_name": chunk["document_name"],
                "page_number": chunk["page_number"],
                "text": chunk["text"]
            }
        ))
    client.upsert(collection_name=COLLECTION, points=points)

def semantic_search(question, top_k=5, document_ids=None):
    _ensure_collection()
    try:
        query_vector = embed_text(question)
    except Exception as e:
        logger.warning(f"Embedding error during search: {e}")
        return []

    results = []
    try:
        # qdrant-client >= 1.10 uses query_points
        if hasattr(client, "query_points"):
            response = client.query_points(
                collection_name=COLLECTION,
                query=query_vector,
                limit=top_k
            )
            results = getattr(response, "points", []) or []
        elif hasattr(client, "search"):
            results = client.search(
                collection_name=COLLECTION,
                query_vector=query_vector,
                limit=top_k
            )
    except Exception as e:
        logger.warning(f"Qdrant search error: {e}")
        return []

    chunks = []
    for result in results:
        payload = getattr(result, "payload", {}) or {}
        if document_ids and payload.get("document_id") not in document_ids:
            continue
        chunks.append({
            "text": payload.get("text", ""),
            "document_name": payload.get("document_name", ""),
            "page_number": payload.get("page_number", 1),
            "document_id": payload.get("document_id", ""),
            "score": getattr(result, "score", 0.0)
        })
    return chunks
