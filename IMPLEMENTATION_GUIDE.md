# Legal Research AI Agent — Implementation Guide

## 1. Objective

This project is a legal research assistant that allows a user to upload legal documents, ask legal questions, retrieve relevant material using RAG, optionally conduct legal web research, reason over the evidence, and return structured answers with citations and session-based follow-up support.

The implementation should be treated as an agentic workflow, not a basic chatbot. The system must follow a clear logic:

Understand → Plan → Retrieve → Research → Reason → Synthesize → Cite → Remember

---

## 2. Technology Stack

### Frontend
- React.js
- Zustand for UI state management

### Backend
- FastAPI
- Python
- LangGraph
- Pydantic

### AI / Retrieval
- LLM integration
- Embeddings
- RAG pipeline
- Semantic search

### Storage
- Qdrant for vector embeddings
- Supabase PostgreSQL for conversation/session memory

### Document Processing
- PDF extraction
- chunking
- embedding generation
- semantic retrieval

### Legal Web Research
- legal-focused search module
- source evaluation against authoritative legal sources

---

## 3. Project Structure

```text
legal-research-ai/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │
│   │   ├── api/
│   │   │   ├── upload.py
│   │   │   ├── research.py
│   │   │   └── conversation.py
│   │
│   │   ├── schemas/
│   │   │   ├── upload.py
│   │   │   ├── research.py
│   │   │   └── conversation.py
│   │
│   │   ├── agent/
│   │   │   ├── graph.py
│   │   │   ├── state.py
│   │   │   ├── nodes.py
│   │   │   └── router.py
│   │
│   │   ├── rag/
│   │   │   ├── loader.py
│   │   │   ├── chunker.py
│   │   │   ├── embeddings.py
│   │   │   └── retriever.py
│   │
│   │   ├── search/
│   │   │   └── legal_search.py
│   │
│   │   ├── memory/
│   │   │   └── conversation.py
│   │
│   │   ├── llm/
│   │   │   └── model.py
│   │
│   │   └── citations/
│   │       └── builder.py
│   │
│   ├── requirements.txt
│   └── .env
│
├── workspace/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.jsx
│   │   │   ├── FileList.jsx
│   │   │   ├── ResearchInput.jsx
│   │   │   ├── ResearchProgress.jsx
│   │   │   ├── Answer.jsx
│   │   │   ├── Sources.jsx
│   │   │   └── ChatHistory.jsx
│   │   │
│   │   ├── store/
│   │   │   └── researchStore.js
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── .env
│
├── README.md
├── .gitignore
└── .env.example
```

---

## 4. Functional Requirements

### 4.1 User Features
The system must allow users to:

1. upload legal documents or PDFs
2. ask legal research questions
3. retrieve relevant information from uploaded documents using RAG
4. perform legal web research when needed
5. decide among document research, web research, or combined research
6. reason over evidence
7. receive structured legal answers with citations
8. continue conversations using session memory
9. detect inconsistent authorities and report them
10. avoid hallucinated authorities, statutes, URLs, and citations

---

## 5. Implementation Roadmap by File

## 5.1 Backend Entry Point

### File: `backend/app/main.py`

Responsibilities:
- initialize FastAPI app
- register routers
- configure app metadata
- include CORS if needed for frontend
- load environment variables

Example responsibilities:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Legal Research AI Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Add router registration:

```python
from app.api.upload import router as upload_router
from app.api.research import router as research_router
from app.api.conversation import router as conversation_router

app.include_router(upload_router)
app.include_router(research_router)
app.include_router(conversation_router)
```

---

## 5.2 API Layer

### File: `backend/app/api/upload.py`

Responsibilities:
- handle file upload
- validate PDF/doc types
- save uploaded files
- trigger document processing pipeline
- return upload status and metadata

Endpoints to implement:

```python
POST /upload
```

Request example:
```json
{
  "files": ["judgment.pdf"],
  "metadata": {
    "source": "user_upload"
  }
}
```

Response example:
```json
{
  "status": "success",
  "documents": [
    {
      "document_id": "doc_123",
      "filename": "judgment.pdf",
      "pages": 30
    }
  ]
}
```

Implementation notes:
- validate file extension
- restrict file size
- reject corrupted PDFs
- store metadata in file system or object storage
- call document ingestion function

---

### File: `backend/app/api/research.py`

Responsibilities:
- receive research query
- accept session_id
- send request to LangGraph orchestrator
- stream or return final structured answer

Endpoint:

```python
POST /research
```

Request example:
```json
{
  "session_id": "sess_001",
  "question": "What reasoning did the court provide on procedural fairness?",
  "documents": ["doc_123"]
}
```

Response example:
```json
{
  "session_id": "sess_001",
  "answer": {
    "summary": "...",
    "analysis": "...",
    "sources": []
  }
}
```

Implementation notes:
- accept optional uploaded document IDs
- trigger graph execution
- parse results into structured response

---

### File: `backend/app/api/conversation.py`

Responsibilities:
- fetch previous conversation for a session
- handle follow-up retrieval
- expose session history

Endpoint:

```python
GET /conversation/{session_id}
```

Implementation notes:
- read messages from Supabase/PostgreSQL
- return ordered messages
- optionally include document references

---

## 5.3 Schemas

### File: `backend/app/schemas/upload.py`

Define upload request and response models.

Example:
```python
from pydantic import BaseModel, Field
from typing import List, Optional

class UploadFileRequest(BaseModel):
    filename: str
    content_type: Optional[str] = None

class UploadResponse(BaseModel):
    status: str
    document_id: Optional[str] = None
    filename: Optional[str] = None
    message: Optional[str] = None
```

### File: `backend/app/schemas/research.py`

Define the research request and answer structures.

Example:
```python
from pydantic import BaseModel, Field
from typing import Optional, List, Any

class ResearchRequest(BaseModel):
    session_id: str
    question: str
    document_ids: Optional[List[str]] = []

class SourceReference(BaseModel):
    type: str  # document or web
    title: Optional[str] = None
    url: Optional[str] = None
    document_name: Optional[str] = None
    page: Optional[int] = None
    authority: Optional[str] = None
    date: Optional[str] = None

class ResearchAnswer(BaseModel):
    summary: str
    relevant_facts: Optional[List[str]] = []
    legal_issues: Optional[List[str]] = []
    applicable_law: Optional[List[str]] = []
    analysis: Optional[str] = None
    conclusion: Optional[str] = None
    sources: List[SourceReference] = []
```

### File: `backend/app/schemas/conversation.py`

Define conversation message schemas.

Example:
```python
from pydantic import BaseModel
from typing import Optional

class MessageRecord(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    created_at: Optional[str] = None
```

---

## 5.4 Agent Layer

### File: `backend/app/agent/state.py`

This module holds the state passed through the graph.

Example structure:
```python
from typing import TypedDict, List, Optional, Any

class ResearchState(TypedDict):
    session_id: str
    question: str
    document_ids: List[str]
    retrieved_chunks: List[dict]
    web_results: List[dict]
    reasoning: Optional[str]
    answer: Optional[dict]
    citations: List[dict]
    status: str
```

This state is passed between nodes in LangGraph.

---

### File: `backend/app/agent/router.py`

Responsibilities:
- determine whether the route is DOCUMENT, WEB, or BOTH
- decide based on:
  - document relevance
  - external authority requirement
  - current legal developments
  - conflict detection

Pseudo-logic:
```python
def route_research(state):
    if not state["document_ids"]:
        return "WEB"

    if has_sufficient_document_content(state):
        return "DOCUMENT"

    if needs_external_authority(state):
        return "BOTH"

    return "WEB"
```

---

### File: `backend/app/agent/nodes.py`

This is the main node logic implementation.

#### `understand_query`
- parse the legal question
- identify user intent
- determine research scope and jurisdiction

#### `plan_research`
- decide which route is best
- set research priorities

#### `retrieve_documents`
- query Qdrant for relevant legal chunks
- return relevant context

#### `web_research`
- perform legal-focused web search if needed
- normalize search results

#### `analyze_and_synthesize`
- combine retrieved context and web results
- form legal reasoning and answer sections

Pseudo example:
```python
def understand_query(state):
    question = state["question"]
    state["status"] = "understood"
    return state
```

---

### File: `backend/app/agent/graph.py`

Responsibilities:
- construct the LangGraph workflow
- connect the nodes
- apply conditional routing

Pseudo example:
```python
from langgraph.graph import StateGraph, END

workflow = StateGraph(ResearchState)
workflow.add_node("understand_query", understand_query)
workflow.add_node("plan_research", plan_research)
workflow.add_node("retrieve_documents", retrieve_documents)
workflow.add_node("web_research", web_research)
workflow.add_node("analyze_and_synthesize", analyze_and_synthesize)

workflow.set_entry_point("understand_query")
workflow.add_conditional_edges(
    "plan_research",
    route_research,
    {
        "DOCUMENT": "retrieve_documents",
        "WEB": "web_research",
        "BOTH": "retrieve_documents",
    },
)
```

Important behavior:
- if BOTH is selected, run document retrieval and web research before reasoning
- store output in state for synthesis

---

## 5.5 RAG Pipeline

### File: `backend/app/rag/loader.py`

Responsibilities:
- load uploaded PDF file into text
- extract document metadata

Functions:
```python
load_document(file_path: str) -> dict
```

Use libraries such as:
- PyMuPDF
- pdfplumber
- pypdf

### File: `backend/app/rag/chunker.py`

Responsibilities:
- split text into manageable chunks
- preserve legal context and page boundaries

Example:
```python
def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120):
    ...
```

Metadata to include:
- document_id
- document_name
- page_number
- chunk_id
- source section if available

### File: `backend/app/rag/embeddings.py`

Responsibilities:
- generate embeddings for chunks
- connect with embedding model

Example:
```python
def embed_text(text: str):
    ...
```

### File: `backend/app/rag/retriever.py`

Responsibilities:
- query vector database
- return top-k relevant chunks
- combine chunk data with metadata

Example:
```python
def semantic_search(question: str, top_k: int = 5):
    ...
```

### Qdrant integration
- store document embeddings in a Qdrant collection
- use metadata filters such as document id and page number
- fetch top-ranked chunks for a question

---

## 5.6 Legal Web Research

### File: `backend/app/search/legal_search.py`

Responsibilities:
- perform legal web search when required
- normalize results for use in reasoning
- evaluate source authority

Pseudo example:
```python
def search_legal_authorities(query: str):
    results = []
    return results
```

Recommended result structure:
```python
{
  "title": "",
  "authority": "Supreme Court of India",
  "date": "2024-01-01",
  "url": "https://example.com",
  "snippet": "..."
}
```

Implementation notes:
- only use credible sources
- avoid unverified, fabricated, or low-quality sources
- keep results separate from uploaded document evidence

---

## 5.7 Memory Layer

### File: `backend/app/memory/conversation.py`

Responsibilities:
- save conversation messages
- fetch session history
- maintain context for follow-up questions

Example methods:
```python
def save_message(session_id: str, role: str, content: str):
    ...

def get_session_messages(session_id: str):
    ...
```

Use Supabase PostgreSQL as persistent store.

---

## 5.8 LLM Integration

### File: `backend/app/llm/model.py`

Responsibilities:
- wrap LLM client configuration
- provide one method to call the LLM model
- manage prompt templates and model selection

Example:
```python
class LLMClient:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def generate(self, prompt: str):
        ...
```

This module should not contain business logic; it should only handle LLM access and response generation.

---

## 5.9 Citation Builder

### File: `backend/app/citations/builder.py`

Responsibilities:
- generate final source references
- combine citations from uploaded documents and web results
- format citations for final answer output

Output example:
```python
[
  {
    "type": "document",
    "document_name": "judgment.pdf",
    "page": 12,
    "snippet": "The court reasoned that ..."
  },
  {
    "type": "web",
    "title": "Supreme Court ruling on procedural fairness",
    "authority": "Supreme Court",
    "date": "2024-01-10",
    "url": "https://..."
  }
]
```

---

## 6. Database Design

### Table: `sessions`
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `messages`
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Qdrant role
Qdrant stores:
- embeddings
- document metadata
- page numbers
- chunk ids
- document ids

This is used for semantic retrieval and not for conversational session state.

---

## 7. Frontend Implementation Plan

## File: `workspace/src/App.jsx`
Responsibilities:
- define overall application layout
- compose the main research interface
- render upload area, question input, answer panels, and history

## File: `workspace/src/store/researchStore.js`
Responsibilities:
- Zustand store
- state fields such as:
  - uploadedFiles
  - activeSession
  - currentQuestion
  - answer
  - sources
  - loading
  - errors
  - chatHistory

Example:
```javascript
import { create } from 'zustand';

export const useResearchStore = create((set) => ({
  uploadedFiles: [],
  sessionId: null,
  question: '',
  answer: null,
  loading: false,
  setQuestion: (question) => set({ question }),
}));
```

## File: `workspace/src/services/api.js`
Responsibilities:
- wrapper for backend API calls
- functions:
  - uploadDocument()
  - startResearch()
  - fetchConversation()

Example:
```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const uploadDocuments = async (formData) => {
  return fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  }).then((res) => res.json());
};
```

## `workspace/src/components/` files

### `FileUpload.jsx`
- drag-and-drop or file picker
- send files to backend

### `FileList.jsx`
- display uploaded legal documents
- show names and upload status

### `ResearchInput.jsx`
- text input area for legal questions
- submit button to trigger research

### `ResearchProgress.jsx`
- show workflow status: understanding, retrieving, reasoning, citing

### `Answer.jsx`
- render answer summary, issue analysis, conclusion

### `Sources.jsx`
- show source references and metadata

### `ChatHistory.jsx`
- show previous messages and context for follow-up questions

---

## 8. API Contract Design

## Endpoints

### `POST /upload`
Purpose:
- upload legal document(s)
- process document metadata
- store file in system

### `POST /research`
Purpose:
- receive user's legal query
- run research graph
- return final answer + citations

### `GET /conversation/{session_id}`
Purpose:
- retrieve conversation history

Important:
- do not implement endpoints that are not present in code
- verify actual endpoints before claiming final API behavior

---

## 9. Research Flow Logic

The workflow should be designed as:

1. user uploads legal documents
2. user asks a legal question
3. system understands issue and intent
4. system plans research strategy
5. system retrieves relevant document chunks
6. if needed, performs legal web research
7. system compares retrieved evidence and resolves conflicts
8. system synthesizes answer
9. system adds citations
10. system stores conversation in session memory
11. system returns structure to frontend

---

## 10. Routing Logic

### DOCUMENT
Use when:
- uploaded documents contain enough relevant material
- answer can be supported by local corpus

### WEB
Use when:
- external legal authority is required
- fresh developments are relevant
- uploaded corpus is insufficient

### BOTH
Use when:
- evidence needs comparison between document and external authorities
- legal issue is unsettled or requires checking developments

---

## 11. Answer Structure

The answer model should support sections such as:

- Summary
- Relevant Facts
- Legal Issues
- Applicable Law
- Court Reasoning / Analysis
- Relevant Precedents
- Conclusion
- Sources

Not every answer needs every section. The system should adapt to the legal question.

---

## 12. Hallucination Mitigation Rules

The system must follow strict safeguards:

- never invent legal authorities
- never fabricate citations
- never invent URLs
- never hide conflicts in authorities
- if evidence is weak, say so explicitly
- prefer evidence-backed statements over speculative answers

---

## 13. Security Rules

- keep API keys in `.env`
- do not commit `.env` to Git
- validate file type and size
- do not expose secrets in logs
- treat legal outputs as informational only
- do not present the output as legal advice

---

## 14. Future Technical Improvements

Planned improvements beyond the current scaffold:

- better legal source ranking
- hybrid retrieval
- reranking
- OCR for scanned PDFs
- asynchronous document processing
- richer legal knowledge graph
- stronger citation verification
- streaming workflow updates

---

## 15. Implementation Checklist

### Backend tasks
- [ ] initialize FastAPI app
- [ ] create upload route
- [ ] create research route
- [ ] create conversation route
- [ ] define pydantic schemas
- [ ] build LangGraph workflow
- [ ] implement router logic
- [ ] implement RAG loader
- [ ] implement chunking
- [ ] build embeddings module
- [ ] integrate Qdrant retrieval
- [ ] implement legal web search module
- [ ] create memory persistence layer
- [ ] implement citation builder
- [ ] configure LLM integration

### Frontend tasks
- [ ] build React app shell
- [ ] implement upload UI
- [ ] implement file listing
- [ ] build research input form
- [ ] show progress states
- [ ] render answer panel
- [ ] render source list
- [ ] display chat history
- [ ] add Zustand store
- [ ] add api service layer

### Data and infra tasks
- [ ] define Supabase tables
- [ ] define Qdrant collection schema
- [ ] configure environment variables
- [ ] ensure `.env` is ignored in Git

---

## 16. Final Notes

This project should be implemented as a structured legal research assistant with grounded retrieval, evidence-based reasoning, citation tracking, and memory-aware follow-up capability. The most important difference from a generic chatbot is that the system is explicitly designed to reason through a research pipeline and maintain legal traceability.

The implementation should be prioritized in this order:

1. project scaffolding
2. FastAPI app setup
3. upload and research API
4. document ingestion and chunking
5. Qdrant retrieval
6. LangGraph workflow
7. web search module
8. final synthesis and citations
9. session memory persistence
10. frontend integration

This order reduces risk and ensures the architecture is built around real functionality instead of isolated demo components.
