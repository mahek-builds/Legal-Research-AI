def route_after_plan(state):
    if state.get("has_documents"):
        return "retrieve_documents"
    return "web_research"

def route_after_assess(state):
    route = state.get("research_route", "WEB")
    if route == "DOCUMENT":
        return "analyze_and_synthesize"
    elif route == "WEB":
        return "web_research"
    else:
        return "web_research"
