from typing import TypedDict, List, Optional

class ResearchState(TypedDict):
    session_id: str
    question: str
    document_ids: List[str]
    needs_external_authority: bool
    has_documents: bool
    research_route: str
    retrieved_chunks: List[dict]
    web_results: List[dict]
    chat_history: List[dict]
    reasoning: Optional[str]
    answer: Optional[dict]
    citations: List[dict]
    status: str
    warnings: List[str]