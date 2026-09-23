def build_citations(doc_chunks=None, web_results=None):
    sources = []

    if doc_chunks:
        for chunk in doc_chunks:
            sources.append({
                "type": "document",
                "document_name": chunk.get("document_name", ""),
                "page": chunk.get("page_number"),
                "snippet": chunk.get("text", "")[:200]
            })

    if web_results:
        for result in web_results:
            sources.append({
                "type": "web",
                "title": result.get("title", ""),
                "url": result.get("url", ""),
                "snippet": result.get("snippet", "")[:200]
            })

    return sources
