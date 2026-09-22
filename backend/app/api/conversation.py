from fastapi import FastAPI
conversation_router=FastAPI()

@conversation_router.post("/conversation")