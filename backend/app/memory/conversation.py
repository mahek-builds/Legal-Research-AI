from supabase import create_client
from app.config import settings
import uuid
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Lazy client — initialized on first use so uvicorn can bind to the port first
_supabase = None
_in_memory_messages = []

def _get_client():
    global _supabase
    if _supabase is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            return None
        try:
            _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        except Exception as e:
            logger.warning(f"Failed to initialize Supabase client: {e}. Falling back to in-memory store.")
            return None
    return _supabase

def save_message(session_id, role, content):
    client = _get_client()
    created_at = datetime.now().isoformat()
    msg_id = str(uuid.uuid4())
    
    # Always keep in-memory backup
    _in_memory_messages.append({
        "id": msg_id,
        "session_id": session_id,
        "role": role,
        "content": content,
        "created_at": created_at
    })
    
    if client:
        try:
            client.table("messages").insert({
                "id": msg_id,
                "session_id": session_id,
                "role": role,
                "content": content,
                "created_at": created_at
            }).execute()
        except Exception as e:
            logger.warning(f"Supabase save_message error: {e}")

async def get_session_messages(session_id):
    client = _get_client()
    if client:
        try:
            response = client.table("messages").select("*").eq(
                "session_id", session_id
            ).order("created_at").execute()
            if response.data:
                return response.data
        except Exception as e:
            logger.warning(f"Supabase get_session_messages error: {e}")
    
    # In-memory fallback
    return [m for m in _in_memory_messages if m["session_id"] == session_id]

def list_sessions():
    client = _get_client()
    if client:
        try:
            response = client.table("messages").select("session_id, created_at").order(
                "created_at", desc=True
            ).execute()
            seen = set()
            sessions = []
            for row in response.data:
                sid = row["session_id"]
                if sid not in seen:
                    seen.add(sid)
                    sessions.append({
                        "id": sid,
                        "created_at": row["created_at"]
                    })
            if sessions:
                return sessions
        except Exception as e:
            logger.warning(f"Supabase list_sessions error: {e}")

    # In-memory fallback
    seen = set()
    sessions = []
    for m in reversed(_in_memory_messages):
        sid = m["session_id"]
        if sid not in seen:
            seen.add(sid)
            sessions.append({
                "id": sid,
                "created_at": m["created_at"]
            })
    return sessions
