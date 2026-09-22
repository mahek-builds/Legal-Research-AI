from pydantic import BaseModel
from typing import List, Optional

class MessageRecord(BaseModel):
    id:str
    session_id:str
    role:str
    content:str
    created_at:Optional[str]=None