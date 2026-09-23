from app.rag.retriever import semantic_search
from app.search.legal_search import search_legal
from app.llm.model import generate
from app.citations.builder import build_citations
from app.memory.conversation import save_message
import json

def understand_query(state):
    question = state["question"].lower()
    keywords = ["latest", "recent", "current", "supreme court",
                "new judgment", "developments", "compare with",
                "amendment", "act", "section"]
    state["needs_external_authority"] = any(k in question for k in keywords)
    state["has_documents"] = len(state.get("document_ids", [])) > 0
    state["status"] = "understood"
    return state

def plan_research(state):
    if not state["has_documents"]:
        state["research_route"] = "WEB"
    else:
        state["research_route"] = "DOCUMENT"
    state["status"] = "planned"
    return state

def retrieve_documents(state):
    doc_ids = state.get("document_ids", [])
    chunks = semantic_search(
        question=state["question"],
        top_k=5,
        document_ids=doc_ids if doc_ids else None
    )
    state["retrieved_chunks"] = chunks
    state["status"] = "retrieved"
    return state

def assess_research_need(state):
    chunks = state.get("retrieved_chunks", [])
    if len(chunks) >= 3:
        if state["needs_external_authority"]:
            state["research_route"] = "BOTH"
        else:
            state["research_route"] = "DOCUMENT"
    elif len(chunks) > 0:
        state["research_route"] = "BOTH"
    else:
        state["research_route"] = "WEB"
    state["status"] = "assessed"
    return state

def web_research(state):
    results = search_legal(state["question"])
    state["web_results"] = results
    state["status"] = "web_searched"
    return state

def analyze_and_synthesize(state):
    context_parts = []

    if state.get("retrieved_chunks"):
        context_parts.append("=== DOCUMENT EVIDENCE ===")
        for chunk in state["retrieved_chunks"]:
            context_parts.append(
                f"[{chunk['document_name']}, Page {chunk['page_number']}]: {chunk['text']}"
            )

    if state.get("web_results"):
        context_parts.append("=== WEB SOURCES ===")
        for result in state["web_results"]:
            context_parts.append(
                f"[{result['title']}] ({result['url']}): {result['snippet']}"
            )

    context = "\n\n".join(context_parts)

    system_prompt = """You are a legal research assistant. Analyze the evidence provided and answer the legal question.
You must:
- Only use facts from the provided evidence
- Never invent cases, statutes, or citations
- Flag any conflicts between sources
- If evidence is insufficient, say so clearly

Respond in this JSON format:
{
    "summary": "brief answer",
    "relevant_facts": ["fact1", "fact2"],
    "legal_issues": ["issue1", "issue2"],
    "applicable_law": ["law1", "law2"],
    "analysis": "detailed reasoning",
    "conclusion": "final conclusion"
}"""

    history_text = ""
    if state.get("chat_history"):
        history_text = "=== PREVIOUS CONVERSATION ===\n"
        for msg in state["chat_history"]:
            role = "User" if msg["role"] == "user" else "Assistant"
            content = msg["content"]
            if role == "Assistant":
                try:
                    parsed = json.loads(content)
                    content = parsed.get("summary", content)
                except:
                    pass
            history_text += f"{role}: {content}\n\n"

    prompt = f"{history_text}Question: {state['question']}\n\nEvidence:\n{context}"

    if not context_parts:
        state["reasoning"] = "Insufficient evidence to provide a grounded answer."
        state["warnings"] = state.get("warnings", []) + [
            "No sources found. Please upload relevant documents or rephrase your question."
        ]
        state["status"] = "synthesized"
        return state

    response = generate(prompt, system_prompt)
    state["reasoning"] = response
    state["status"] = "synthesized"
    return state

def generate_answer(state):
    reasoning = state.get("reasoning", "")

    try:
        answer = json.loads(reasoning)
    except json.JSONDecodeError:
        answer = {
            "summary": reasoning,
            "relevant_facts": [],
            "legal_issues": [],
            "applicable_law": [],
            "analysis": reasoning,
            "conclusion": ""
        }

    citations = build_citations(
        doc_chunks=state.get("retrieved_chunks"),
        web_results=state.get("web_results")
    )
    answer["sources"] = citations

    if state.get("warnings"):
        answer["warnings"] = state["warnings"]

    state["answer"] = answer
    state["citations"] = citations
    state["status"] = "complete"

    try:
        save_message(state["session_id"], "user", state["question"])
        save_message(state["session_id"], "assistant", json.dumps(answer))
    except Exception as e:
        print(f"Memory save error: {e}")

    return state
