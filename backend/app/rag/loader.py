from pypdf import PdfReader

def load_document(file_path):
    reader = PdfReader(file_path)
    pages = []
    for page_num, page in enumerate(reader.pages):
        text = page.extract_text()
        if text and text.strip():
            pages.append({
                "page_number": page_num + 1,
                "text": text.strip()
            })
    return pages
