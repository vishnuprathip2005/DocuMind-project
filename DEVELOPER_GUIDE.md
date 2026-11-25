# DocuMind — Developer Guide

Welcome to the **DocuMind** developer guide. This document serves as the primary technical reference for contributing to, extending, and maintaining both the backend service and the frontend web application.

---

## 1. Project Directory Reference

Use this directory structure as your reference map when navigating or modifying the codebase:

```text
document project/
├── backend/
│   ├── app/
│   │   ├── core/config.py              # App settings & env loading
│   │   ├── db/
│   │   │   ├── models.py               # Document database model (SQLAlchemy)
│   │   │   └── session.py              # DB engine and session factory
│   │   ├── routers/
│   │   │   ├── documents.py            # Upload, list, preview, download, delete
│   │   │   └── chat.py                 # POST /api/chat and GET /api/health
│   │   ├── schemas/                    # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── file_storage.py         # File persistence & path security
│   │   │   ├── text_extraction.py      # Format decoding & JSON flattening
│   │   │   ├── retrieval.py            # Search & snippet extraction
│   │   │   └── ai_provider.py          # Mock & Groq LLM generators
│   │   └── main.py                     # FastAPI entrypoint & CORS setup
│   ├── tests/                          # 23 Pytest unit & integration tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                        # Typed Axios/Fetch API callers
│   │   ├── components/                 # UI components (Chat, List, Modals, etc.)
│   │   ├── pages/Dashboard.tsx         # Central page composing all views
│   │   └── index.css                   # Dark-slate CSS variables & utility classes
│   ├── package.json
│   └── vite.config.ts
├── sample_docs/                        # Sample policies & benefits files for testing
├── storage/                            # Physical uploaded files & SQLite DB
└── README.md                           # Comprehensive documentation
```

---

## 2. Architecture & Component Responsibilities

### Backend Architecture (`backend/app/`)

| File / Module | Responsibility | Key Functions / Classes |
| :--- | :--- | :--- |
| `core/config.py` | Centralized Pydantic application settings; parses `.env`, CORS whitelist, upload size limits, and AI provider config. | `Settings`, `settings` |
| `db/models.py` | Declarative SQLAlchemy ORM models representing the documents table. | `Document`, `utc_now()` |
| `db/session.py` | Database engine creation, connection pooling, sessionmaker, and table auto-initialization. | `engine`, `SessionLocal`, `get_db()`, `init_db()` |
| `routers/documents.py` | REST endpoints for uploading documents, listing newest-first, fetching details, streaming original downloads, and deleting. | `upload_document()`, `list_documents()`, `get_document()`, `download_document()`, `delete_document()` |
| `routers/chat.py` | Chat query endpoint orchestrating document retrieval and AI response generation, plus the health check endpoint. | `chat_endpoint()`, `health_check()` |
| `schemas/document.py` | Pydantic response models for document metadata, preview details, and error contracts. | `DocumentMetadata`, `DocumentDetail` |
| `schemas/chat.py` | Pydantic schemas validating user chat questions, source citations, and provider metadata. | `ChatRequest`, `ChatResponse`, `SourceItem` |
| `services/file_storage.py` | Secure disk persistence, UUID-based file naming, path-traversal prevention, safe deletion, and atomic cleanup. | `save_upload_file()`, `delete_stored_file()`, `get_safe_file_path()` |
| `services/text_extraction.py` | Multi-format text decoding (`.txt`, `.md`) and recursive JSON tree flattening into searchable key-value lines. | `extract_text()`, `_flatten_json()` |
| `services/retrieval.py` | Keyword tokenization, stop-word removal, document relevance ranking, and dynamic context window snippet extraction. | `rank_documents()`, `extract_snippet()`, `tokenize()` |
| `services/ai_provider.py` | Answer synthesis engine supporting deterministic offline mock extraction and cloud Groq LLM completions (`llama-3.3-70b-versatile`). | `generate_answer()`, `_generate_mock_answer()`, `_generate_groq_answer()` |
| `main.py` | FastAPI application initialization, CORS middleware, global exception handlers, and router registration. | `app` |

---

### Frontend Architecture (`frontend/src/`)

| Directory / File | Responsibility |
| :--- | :--- |
| `api/client.ts` | Base API request client configured with `VITE_API_BASE_URL` and JSON response parsing. |
| `api/documents.ts` | API wrappers for `fetchDocuments`, `uploadDocument`, `deleteDocument`, and `getDocumentDetails`. |
| `api/chat.ts` | API wrappers for `sendChatMessage` and `fetchHealth`. |
| `components/Header.tsx` | Top application header with live backend connectivity badge and API documentation link. |
| `components/StatsBar.tsx` | Summary counters displaying total documents, indexed file volume, and supported format tags. |
| `components/UploadPanel.tsx` | Drag-and-drop file upload zone with format constraints and real-time upload progress. |
| `components/DocumentList.tsx` | Searchable and format-filtered list of documents (`ALL`, `TXT`, `MD`, `JSON`) with preview, download, and delete actions. |
| `components/ChatPanel.tsx` | Conversational interface with quick-prompt suggestions, copy-to-clipboard, loading indicators, and source citation links. |
| `components/DocumentPreviewModal.tsx` | In-app modal for inspecting extracted text and document metadata without downloading. |
| `components/DeleteConfirmModal.tsx` | Confirmation dialog to prevent accidental document deletion. |
| `components/Toast.tsx` | Non-blocking floating notifications for successes, warnings, and errors. |
| `pages/Dashboard.tsx` | Root state orchestrator uniting document repository operations with the chat assistant. |

---

## 3. Developer Environment Setup

### 3.1 Backend Setup

1. **Navigate to the workspace root**:
   ```bash
   cd "e:\vlome e\document project"
   ```

2. **Create and activate a virtual environment**:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Environment Variables**:
   Copy the example environment configuration:
   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

   Key environment variables:
   - `DATABASE_URL`: `sqlite:///./storage/document_ai.db` (default) or `postgresql+psycopg://user:pass@localhost:5432/dbname`
   - `AI_PROVIDER`: `mock` (default local) or `groq`
   - `GROQ_API_KEY`: Required only when `AI_PROVIDER=groq`
   - `GROQ_MODEL`: Default `llama-3.3-70b-versatile`
   - `MAX_UPLOAD_SIZE_MB`: Default `10`

5. **Start the Development API Server**:
   ```powershell
   $env:PYTHONPATH="backend"
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   - Swagger Documentation: `http://localhost:8000/docs`
   - OpenAPI Schema: `http://localhost:8000/openapi.json`
   - Health Endpoint: `http://localhost:8000/api/health`

---

### 3.2 Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install node dependencies**:
   ```bash
   npm install
   ```

3. **Configure Frontend Environment**:
   Ensure `.env` in `frontend/` contains:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Typecheck & Production Build**:
   ```bash
   npm run build
   ```

---

## 4. Testing & Verification

The backend includes a comprehensive suite of 23 automated tests covering file handling, security constraints, and AI retrieval logic.

### Run All Backend Tests:
```powershell
$env:PYTHONPATH="backend"
python -m pytest backend/tests -v
```

### Run Specific Test Modules:
```powershell
# Document management tests (upload, download, delete, path traversal, validation):
python -m pytest backend/tests/test_documents.py -v

# Retrieval & chat tests (ranking, context windowing, mock mode):
python -m pytest backend/tests/test_chat.py -v
```

---

## 5. Security & Development Guidelines

1. **Path-Traversal Protection**:
   Never use user-provided filenames to save files directly to the filesystem. Always generate a unique UUID via `uuid.uuid4()` and use `get_safe_file_path()` in [file_storage.py](file:///e:/vlome%20e/document%20project/backend/app/services/file_storage.py) to confirm the resolved path remains inside `STORAGE_DIR`.

2. **Data Model Integrity**:
   Always pass queries through SQLAlchemy's parameterized query engine or ORM methods to eliminate SQL injection vulnerabilities.

3. **Atomic File Operations**:
   When persisting files in `upload_document`, maintain an exception boundary that removes written files from disk if the database transaction fails.

4. **Grounding & RAG Principles**:
   When adding or updating retrieval features in `retrieval.py` and `ai_provider.py`, verify that citations are consistently preserved and returned with their matching document UUIDs.
