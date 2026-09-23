from supabase import create_client
from app.config import settings
import uuid
from datetime import datetime

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def save_message(session_id, role, content):
    supabase.table("messages").insert({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "role": role,
        "content": content,
        "created_at": datetime.now().isoformat()
    }).execute()

async def get_session_messages(session_id):
    response = supabase.table("messages").select("*").eq(
        "session_id", session_id
    ).order("created_at").execute()
    return response.data

def list_sessions():
    # Fetch all messages ordered by time to get the latest sessions
    response = supabase.table("messages").select("session_id, created_at").order(
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
    return sessions
