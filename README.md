# DocuMind — Document Management & AI Knowledge Assistant

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17+-4169E1.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4+-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)

A production-ready full-stack web application designed for secure document storage, text extraction, deterministic keyword retrieval, and grounded AI question-answering with exact source document attribution.

Built with **FastAPI** + **PostgreSQL / SQLAlchemy** + **React / Vite / TypeScript** with a handcrafted, modern dark-slate UI and a deterministic mock AI engine that runs 100% locally out-of-the-box without requiring an external API key.

---

## ⚡ Features

- **Document Management**:
  - Secure multi-format upload (`.txt`, `.md`, `.json`).
  - Safe server-side generated storage filenames (UUID-based; prevents path traversal and injection).
  - Validation against unsupported extensions, empty files, and size limits (default 10 MB).
  - Structured JSON recursive flattening into searchable text preserving key/value context.
  - Newest-first document listing with file size formatting, dates, and format badges.
  - Safe original file streaming download with `Content-Disposition`.
  - Permanent document deletion with safe disk file and database record cleanup.
- **Grounded AI Question-Answering**:
  - Keyword overlap & term frequency retrieval algorithm with stop-word filtering.
  - Dynamic snippet extraction centered around matched query terms.
  - Exact source document tracking (`id` and `originalName`) returned directly from backend retrieval results.
  - Dual AI Mode:
    - **Local Mock Mode (Default)**: Deterministic, context-grounded response synthesized directly from matched document snippets. Zero external network calls or API keys required.
    - **Groq LLM Mode**: Uses Groq / OpenAI-compatible chat completions (`llama-3.3-70b-versatile` or configured model) with a strict grounding system instruction.
- **Handcrafted Rich Frontend**:
  - Dual-column responsive layout: **Document Repository Hub** and **AI Knowledge Assistant**.
  - Drag-and-drop file upload with animated states and format constraints.
  - Live document search filter and format filters (`ALL`, `TXT`, `MD`, `JSON`).
  - Interactive **Document Preview Modal**: inspect extracted searchable text and metadata without downloading.
  - Confirmation modal before file deletion.
  - Interactive chat interface with real-time feedback, suggested prompts, copy-to-clipboard, and clickable source citation chips.
  - Non-intrusive floating toast notifications.

---

## 🏗️ Repository Architecture

```text
document-ai-assistant/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── config.py            # Pydantic Settings & environment config
│   │   ├── db/
│   │   │   ├── models.py            # SQLAlchemy Document model
│   │   │   └── session.py           # DB Engine, sessionmaker, and table init
│   │   ├── routers/
│   │   │   ├── documents.py         # POST, GET, GET /download, DELETE
│   │   │   └── chat.py              # POST /api/chat endpoint
│   │   ├── schemas/
│   │   │   ├── document.py          # DocumentMetadata, DocumentDetail
│   │   │   └── chat.py              # ChatRequest, ChatResponse, SourceItem
│   │   ├── services/
│   │   │   ├── file_storage.py      # Safe local file persistence & validation
│   │   │   ├── text_extraction.py   # .txt, .md decoding & recursive JSON flattening
│   │   │   ├── retrieval.py         # Tokenization, stop words, keyword overlap
│   │   │   └── ai_provider.py       # Deterministic mock + Groq LLM adapter
│   │   └── main.py                  # FastAPI app, CORS, error handlers, health
│   ├── tests/
│   │   ├── conftest.py              # Pytest client & isolated in-memory DB fixture
│   │   ├── test_documents.py        # 16 tests: upload, list, download, delete, etc.
│   │   └── test_chat.py             # 7 tests: retrieval, mock mode, chat validation
│   ├── requirements.txt             # Python dependencies
│   └── .env.example                 # Backend environment variable template
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts            # Configurable API client with VITE_API_BASE_URL
│   │   │   ├── documents.ts         # Document CRUD requests
│   │   │   └── chat.ts              # Chat & health API calls
│   │   ├── components/
│   │   │   ├── Header.tsx           # Brand, API health status, Swagger docs link
│   │   │   ├── StatsBar.tsx         # Volume counters & supported format badges
│   │   │   ├── UploadPanel.tsx      # Drag & drop upload area with validations
│   │   │   ├── DocumentList.tsx     # Filterable document cards with preview/dl/delete
│   │   │   ├── ChatPanel.tsx        # Chat messages, suggested prompts, citations
│   │   │   ├── SourceList.tsx       # Grounded source chips
│   │   │   ├── DocumentPreviewModal.tsx # Text viewer modal
│   │   │   ├── DeleteConfirmModal.tsx   # Safety confirmation dialog
│   │   │   └── Toast.tsx            # Floating toast notification system
│   │   ├── pages/
│   │   │   └── Dashboard.tsx        # Main application dashboard
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css                # Handcrafted dark-slate design system
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
├── sample_docs/                     # Ready-to-use sample test documents
│   ├── leave-policy.txt
│   ├── remote-work-guidelines.md
│   └── employee-benefits.json
├── storage/                         # Local upload storage directory
│   └── .gitkeep
├── .gitignore
├── DEVELOPER_GUIDE.md               # Technical developer guide & architecture reference
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.10+** (tested with Python 3.13)
- **Node.js 18+** & **npm**
- (Optional) **PostgreSQL 14+** (if omitted, falls back to SQLite out-of-the-box)

---

### 2. Backend Setup

1. Open your terminal and navigate to the project directory:
   ```bash
   cd "e:\vlome e\document project"
   ```

2. (Optional) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   ```

3. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Configure environment settings:
   ```bash
   cp backend/.env.example backend/.env
   ```

   **Database Configuration Options**:
   - **Default local SQLite** (instant, zero setup):
     ```env
     DATABASE_URL=sqlite:///./storage/document_ai.db
     ```
   - **PostgreSQL**:
     ```env
     DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/document_ai
     ```

   **AI Provider Configuration**:
   - **Default Mock Mode (No API key needed)**:
     ```env
     AI_PROVIDER=mock
     ```
   - **Groq LLM Mode**:
     ```env
     AI_PROVIDER=groq
     GROQ_API_KEY=gsk_your_groq_api_key_here
     GROQ_MODEL=llama-3.3-70b-versatile
     ```

5. Run the Backend API server:
   ```bash
   # From the project root with backend on PYTHONPATH:
   $env:PYTHONPATH="backend"
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

   The backend will start at `http://localhost:8000`.
   - **Interactive Swagger UI**: `http://localhost:8000/docs`
   - **OpenAPI Schema**: `http://localhost:8000/openapi.json`
   - **Health Check**: `http://localhost:8000/api/health`

---

### 3. Frontend Setup

1. Open a new terminal in the frontend directory:
   ```bash
   cd "e:\vlome e\document project\frontend"
   ```

2. Install dependencies:
   ```bash
   npm install
   # or on Windows with script policies:
   npm.cmd install
   ```

3. Configure environment variable:
   ```bash
   # Ensure .env has:
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   # or
   npm.cmd run dev
   ```

5. Open your browser at `http://localhost:5173`.

---

## 🧪 Automated Testing

Automated tests cover all functional requirements using an isolated in-memory test database and temporary storage:

```bash
# Run the complete test suite:
$env:PYTHONPATH="backend"
python -m pytest backend/tests -v
```

### Test Suite Summary (23 Tests, 100% Pass)
| Test Module | Test Name | Result |
| :--- | :--- | :---: |
| `test_documents.py` | `test_list_empty_documents` | ✅ PASSED |
| `test_documents.py` | `test_upload_valid_txt` | ✅ PASSED |
| `test_documents.py` | `test_upload_valid_md` | ✅ PASSED |
| `test_documents.py` | `test_upload_valid_json` | ✅ PASSED |
| `test_documents.py` | `test_upload_unsupported_extension` (rejects .pdf) | ✅ PASSED |
| `test_documents.py` | `test_upload_empty_file` (rejects 0 bytes) | ✅ PASSED |
| `test_documents.py` | `test_upload_oversized_file` (HTTP 413) | ✅ PASSED |
| `test_documents.py` | `test_upload_malformed_json` (rejects syntax error) | ✅ PASSED |
| `test_documents.py` | `test_upload_missing_file_field` (HTTP 422) | ✅ PASSED |
| `test_documents.py` | `test_list_documents_ordering` (newest first) | ✅ PASSED |
| `test_documents.py` | `test_get_document_by_id` | ✅ PASSED |
| `test_documents.py` | `test_get_document_invalid_and_missing_id` (400 / 404) | ✅ PASSED |
| `test_documents.py` | `test_download_document` (content & filename header) | ✅ PASSED |
| `test_documents.py` | `test_download_missing_or_malformed` | ✅ PASSED |
| `test_documents.py` | `test_delete_document` (file & DB removed) | ✅ PASSED |
| `test_documents.py` | `test_delete_missing_or_malformed` | ✅ PASSED |
| `test_documents.py` | `test_openapi_schema` (schema validated) | ✅ PASSED |
| `test_chat.py` | `test_retrieval_ranking_unit` (relevant > irrelevant) | ✅ PASSED |
| `test_chat.py` | `test_retrieval_snippet_extraction` (context window) | ✅ PASSED |
| `test_chat.py` | `test_chat_empty_question` (HTTP 422 rejected) | ✅ PASSED |
| `test_chat.py` | `test_chat_no_documents` (helpful fallback message) | ✅ PASSED |
| `test_chat.py` | `test_chat_with_relevant_and_irrelevant_documents` | ✅ PASSED |
| `test_chat.py` | `test_chat_unrelated_query_returns_no_sources` | ✅ PASSED |

### Frontend Build Check
```bash
cd frontend
npm.cmd run build
```
Result: `✓ built in 2.74s` with zero errors.

---

## 📡 API Contract Reference

### 1. Document Management Endpoints

| Method | Endpoint | Request | Status | Description |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/documents` | `multipart/form-data` (`file`) | `201` | Upload a `.txt`, `.md`, or `.json` file. |
| `GET` | `/api/documents` | None | `200` | List all documents ordered by `uploadedAt DESC`. |
| `GET` | `/api/documents/{id}` | Path: `id` (UUID) | `200` | Retrieve document metadata and extracted preview snippet. |
| `GET` | `/api/documents/{id}/download` | Path: `id` (UUID) | `200` | Download original bytes with original filename. |
| `DELETE` | `/api/documents/{id}` | Path: `id` (UUID) | `204` | Permanently delete file from storage and database. |

### 2. AI Chat & Health Endpoints

| Method | Endpoint | Request | Status | Description |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/chat` | `{"question": "string"}` | `200` | Query uploaded documents; returns answer, sources, and mode. |
| `GET` | `/api/health` | None | `200` | Service health status and configured AI provider. |

#### Example: Chat Request
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "How many days of sick leave are allowed?"}'
```

#### Example: Chat Response
```json
{
  "answer": "Based on the uploaded documents (leave-policy.txt), here is the relevant information found:\n\n• From leave-policy.txt: \"All regular full-time employees are entitled to 12 paid sick leave days per calendar year.\"",
  "sources": [
    {
      "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
      "originalName": "leave-policy.txt"
    }
  ],
  "mode": "mock"
}
```

---

## 🔒 Security & Reliability Guarantees

1. **Path Traversal Protection**: Stored files are written with server-generated UUID tokens in a dedicated directory. Absolute canonical path checks guarantee that no path outside `STORAGE_DIR` can be accessed.
2. **Strict MIME & Extension Validation**: Content is parsed and validated (e.g. JSON syntax is tested using `json.loads`).
3. **No Information Leaks**: Database queries use SQLAlchemy ORM parameterization. Internal filesystem paths, secrets, and raw stack traces are never sent to the client.
4. **Resilient Failure Handling**: If database persistence fails during upload, the saved file on disk is immediately rolled back to prevent orphaned files.
5. **Deterministic Mock Mode**: The application is fully testable and operational locally without any external API keys or cloud dependencies.

---

## 📄 License
MIT License. Created for the Document Management & AI Assistant project.
