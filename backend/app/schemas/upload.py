from pydantic import BaseModel,Field
from typing import List, Optional

class UploadRequest(BaseModel):
    file_name:str
    content_type:Optional[str]=None

class UploadResponse(BaseModel):
    status:str
    document_id:Optional[str]    
    file_nme:Optional[str]=None
    message:Optional[str]=None
    
