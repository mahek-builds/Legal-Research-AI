from fastapi import APIRouter
from app.memory.conversation import get_session_messages, list_sessions

conversation_router = APIRouter()

@conversation_router.get("/conversation/{session_id}")
async def get_conversation(session_id: str):
    messages = await get_session_messages(session_id)
    return {"session_id": session_id, "messages": messages}

@conversation_router.get("/sessions")
def get_sessions():
    sessions = list_sessions()
    return {"sessions": sessions}