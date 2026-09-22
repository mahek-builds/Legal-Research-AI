from pydantic import BaseModel
from typing import List,Optional,TypedDict,Any


class ResearchState(TypedDict):
    session_id:str
    query:str
    documents_ids:Optional[List[str]]
    web_results: List[dict]
    reasoning: Optional[str]
    answer: Optional[dict]
    citations: List[dict]
    status: str