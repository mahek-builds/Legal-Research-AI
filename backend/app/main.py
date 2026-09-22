from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
app=FastAPI(title="Legal-Research-AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]

)
from fastapi.api.upload import upload_router
from fastapi.api.research import research_router
from fastapi.api.conversation import conversation_router

app.include_router(upload_router)
app.include_router(research_router)
app.include_router(conversation_router)


