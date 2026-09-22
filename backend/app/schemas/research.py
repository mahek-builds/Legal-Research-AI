from pydantic import BaseModel
from typing import Optional,List,Any

class ResearchRequest(BaseModel):
    session_id:str
    query:str
    documents_ids:Optional[List[str]]=[]


class SourceReference(BaseModel):
    type: str  # document or web
    title: Optional[str] = None
    url: Optional[str] = None
    document_name: Optional[str] = None
    page: Optional[int] = None
    authority: Optional[str] = None
    date: Optional[str] = None

class ResearchAnswer(BaseModel):
    summary: str
    relevant_facts: Optional[List[str]] = []
    legal_issues: Optional[List[str]] = []
    applicable_law: Optional[List[str]] = []
    analysis: Optional[str] = None
    conclusion: Optional[str] = None
    sources: List[SourceReference] = []
