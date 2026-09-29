import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title="LexAgent API",
    description="Backend API for Legal Research AI with RAG and Dual-Source Reasoning",
    version="1.0.0"
)

# Configure CORS - allow all frontend origins including Netlify & localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

from app.api.upload import upload_router
from app.api.research import research_router
from app.api.conversation import conversation_router

app.include_router(upload_router)
app.include_router(research_router)
app.include_router(conversation_router)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@app.on_event("startup")
async def warmup():
    """Pre-load the embedding model on startup so uploads process instantly."""
    import logging
    log = logging.getLogger("lexagent")
    log.info("Pre-loading FastEmbed model...")
    try:
        from app.rag.embeddings import get_embedding_model
        get_embedding_model()
        log.info("FastEmbed model ready!")
    except Exception as e:
        log.error(f"Warmup error: {e}")

@app.get("/")
def root():
    return {"status": "ok", "service": "LexAgent API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)