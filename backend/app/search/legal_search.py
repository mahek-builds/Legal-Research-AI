from tavily import TavilyClient
from app.config import settings

# Lazy client — initialized on first use so uvicorn can bind to the port first
_tavily = None

def _get_client():
    global _tavily
    if _tavily is None:
        _tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)
    return _tavily

def search_legal(query, max_results=5):
    try:
        response = _get_client().search(
            query=f"legal {query}",
            max_results=max_results,
            search_depth="advanced"
        )
        results = []
        for item in response.get("results", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "snippet": item.get("content", ""),
                "score": item.get("score", 0)
            })
        return results
    except Exception as e:
        print(f"Search error: {e}")
        return []
