def chunk_text(pages, doc_id, filename, chunk_size=800, overlap=120):
    chunks = []
    chunk_id = 0

    for page in pages:
        text = page["text"]
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk_content = text[start:end]

            chunks.append({
                "chunk_id": f"{doc_id}_chunk_{chunk_id}",
                "document_id": doc_id,
                "document_name": filename,
                "page_number": page["page_number"],
                "text": chunk_content
            })

            chunk_id += 1
            start += chunk_size - overlap

    return chunks
