from fastapi import APIRouter, UploadFile, File, HTTPException
from app.rag.loader import load_document
from app.rag.chunker import chunk_text
from app.rag.embeddings import embed_batch
from app.rag.retriever import store_chunks
import shutil, os, uuid

upload_router = APIRouter()

@upload_router.post("/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    for file in files:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(400, f"Only PDF files allowed. Invalid file: {file.filename}")

    results = []
    for file in files:
        doc_id = str(uuid.uuid4())
        save_path = os.path.join("uploads", f"{doc_id}.pdf")

        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        pages = load_document(save_path)
        chunks = chunk_text(pages, doc_id, file.filename)
        chunks = embed_batch(chunks)
        store_chunks(chunks)

        results.append({
            "document_id": doc_id,
            "filename": file.filename,
            "pages": len(pages)
        })

    return {
        "status": "success",
        "documents": results
    }
