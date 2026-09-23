from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
app=FastAPI(title="LexAgent")
import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)
from app.api.upload import upload_router
from app.api.research import research_router
from app.api.conversation import conversation_router

app.include_router(upload_router)
app.include_router(research_router)
app.include_router(conversation_router)



os.makedirs("uploads",exist_ok=True)
@app.get("/")
def health():
    return {"status":"ok"}