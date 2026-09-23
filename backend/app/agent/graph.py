from langgraph.graph import StateGraph, END
from app.agent.state import ResearchState
from app.agent.nodes import (
    understand_query,
    plan_research,
    retrieve_documents,
    assess_research_need,
    web_research,
    analyze_and_synthesize,
    generate_answer
)
from app.agent.router import route_after_plan, route_after_assess
from app.memory.conversation import get_session_messages

workflow = StateGraph(ResearchState)

workflow.add_node("understand_query", understand_query)
workflow.add_node("plan_research", plan_research)
workflow.add_node("retrieve_documents", retrieve_documents)
workflow.add_node("assess_research_need", assess_research_need)
workflow.add_node("web_research", web_research)
workflow.add_node("analyze_and_synthesize", analyze_and_synthesize)
workflow.add_node("generate_answer", generate_answer)

workflow.set_entry_point("understand_query")

workflow.add_edge("understand_query", "plan_research")

workflow.add_conditional_edges(
    "plan_research",
    route_after_plan,
    {
        "retrieve_documents": "retrieve_documents",
        "web_research": "web_research"
    }
)

workflow.add_edge("retrieve_documents", "assess_research_need")

workflow.add_conditional_edges(
    "assess_research_need",
    route_after_assess,
    {
        "analyze_and_synthesize": "analyze_and_synthesize",
        "web_research": "web_research"
    }
)

workflow.add_edge("web_research", "analyze_and_synthesize")

workflow.add_edge("analyze_and_synthesize", "generate_answer")

workflow.add_edge("generate_answer", END)

graph = workflow.compile()

async def run_research(session_id, question, document_ids=None):
    history = await get_session_messages(session_id)
    
    initial_state = {
        "session_id": session_id,
        "question": question,
        "document_ids": document_ids or [],
        "needs_external_authority": False,
        "has_documents": bool(document_ids),
        "research_route": "",
        "retrieved_chunks": [],
        "web_results": [],
        "chat_history": history[-6:] if history else [], # Only keep last 3 pairs for context limit
        "reasoning": None,
        "answer": None,
        "citations": [],
        "status": "started",
        "warnings": []
    }

    result = graph.invoke(initial_state)

    return {
        "session_id": session_id,
        "answer": result.get("answer", {}),
        "status": result.get("status", "error")
    }
