from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from app.rag.embeddings import embed_text
import uuid

client = QdrantClient(":memory:")

COLLECTION = "legal_documents"

try:
    client.create_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )
except Exception:
    pass

def store_chunks(chunks):
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
    query_vector = embed_text(question)

    results = client.search(
        collection_name=COLLECTION,
        query_vector=query_vector,
        limit=top_k
    )

    chunks = []
    for result in results:
        if document_ids and result.payload["document_id"] not in document_ids:
            continue
        chunks.append({
            "text": result.payload["text"],
            "document_name": result.payload["document_name"],
            "page_number": result.payload["page_number"],
            "document_id": result.payload["document_id"],
            "score": result.score
        })
    return chunks
