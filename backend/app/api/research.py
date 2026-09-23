from fastapi import APIRouter
from app.schemas.research import ResearchRequest
from app.agent.graph import run_research

research_router = APIRouter()

@research_router.post("/research")
async def research(request: ResearchRequest):
    result = await run_research(
        session_id=request.session_id,
        question=request.question,
        document_ids=request.document_ids
    )
    return result