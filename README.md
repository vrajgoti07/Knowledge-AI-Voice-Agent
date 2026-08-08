# 🧠 Knowledge AI

> **A full-stack RAG (Retrieval-Augmented Generation) platform** — upload documents, chat with your knowledge base, and get AI-powered answers grounded in your own content.

---

## ✨ Features

- 📄 **Multi-format Document Ingestion** — PDF, DOCX, PPTX, and more via PyMuPDF, python-docx & python-pptx
- 🔍 **Semantic Vector Search** — powered by [Qdrant](https://qdrant.tech/) + `sentence-transformers` (`all-MiniLM-L6-v2`)
- 🤖 **LLM-backed Chat** — conversational Q&A grounded in your documents using Google Gemini
- ⚡ **Async Background Processing** — Celery + Redis worker queue keeps the API responsive during heavy ingestion
- 🔐 **JWT Authentication** — secure user registration, login, and role-based access (admin / user)
- 📡 **Real-time Updates** — WebSocket streams for chat responses and document processing status
- 🛡️ **Admin Panel** — manage users, documents, and system settings
- 📊 **Dashboard & Stats** — usage analytics and system health endpoint
- 🐳 **Docker Compose** — one-command production stack (Postgres, Qdrant, Redis, Backend)

---

## 🏗️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| API Framework | FastAPI + Uvicorn |
| ORM / Database | SQLAlchemy 2 · SQLite (dev) · PostgreSQL (prod) |
| Vector Store | Qdrant |
| Embeddings | `sentence-transformers` (`all-MiniLM-L6-v2`) |
| LLM Provider | Google Gemini (`google-generativeai`) |
| Task Queue | Celery + Redis |
| Auth | JWT (`python-jose`) + `passlib` / `bcrypt` |
| Document Parsing | PyMuPDF · python-docx · python-pptx · pypdf |
| Real-time | WebSockets |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Routing | React Router v7 |
| State Management | Zustand + TanStack Query |
| UI Components | Radix UI primitives + Tailwind CSS v4 |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| Charts | Recharts |

---

## 📁 Project Structure

```
knowledge-ai/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, Qdrant client, security helpers
│   │   ├── db/            # SQLAlchemy session, Base, seeding
│   │   ├── models/        # ORM models (User, Document, Chat, …)
│   │   ├── routers/       # API routes (auth, documents, chat, admin, stats, health)
│   │   ├── schemas/       # Pydantic request / response schemas
│   │   ├── services/      # Business logic (document, chat, embedding, LLM, retrieval)
│   │   ├── tasks/         # Celery background tasks
│   │   ├── websockets/    # WS endpoints (chat, document status)
│   │   └── main.py        # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages (auth, dashboard, admin, …)
│   │   ├── services/      # Axios API clients
│   │   ├── store/         # Zustand global state
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml     # Full production stack
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Python | ≥ 3.10 |
| Node.js | ≥ 18 |
| Docker & Docker Compose | Latest |

---

## 🐳 Option A — Docker Compose (Recommended for Production)

Spin up Postgres, Qdrant, Redis, and the Backend API in one command:

```bash
docker compose up -d
```

> The frontend is served separately (see Option B) or you can add it to the compose file for a fully containerised stack.

---

## 🛠️ Option B — Local Development

Run each process in its own terminal window.

### 1. Start Infrastructure Services

```bash
# Redis
docker run -d -p 6379:6379 redis:7-alpine

# Qdrant
docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest
```

### 2. Configure the Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set at minimum:

```dotenv
GEMINI_API_KEY=your_gemini_api_key_here   # https://aistudio.google.com/apikey
SECRET_KEY=a_long_random_secret_string
DATABASE_URL=sqlite:///./knowledge_ai.db  # or a PostgreSQL URL for production
```

Install dependencies:

```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
```

### 3. Start the Celery Worker

> Run in a **dedicated terminal** — do **not** use `--reload` on the worker.

```bash
cd backend
celery -A app.tasks.document_tasks worker --loglevel=info
```

### 4. Start the FastAPI Server

```bash
cd backend
uvicorn app.main:app --reload
```

API is now available at **http://localhost:8000**
Interactive docs: **http://localhost:8000/docs**

### 5. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend is now available at **http://localhost:5173**

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | *(required)* | Google Gemini API key |
| `SECRET_KEY` | *(required)* | JWT signing secret |
| `DATABASE_URL` | `sqlite:///./knowledge_ai.db` | SQLAlchemy database URL |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL |
| `QDRANT_HOST` | `localhost` | Qdrant host |
| `QDRANT_PORT` | `6333` | Qdrant port |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant full URL |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence-transformers model |
| `MAX_UPLOAD_SIZE_MB` | `50` | Max upload size in MB |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins (JSON array) |
| `ADMIN_SEED_EMAIL` | — | Admin account email (auto-created on first start) |
| `ADMIN_SEED_PASSWORD` | — | Admin account password |
| `LLM_TIMEOUT_SECONDS` | `10` | Per-provider LLM timeout in seconds |

### Frontend (`frontend/.env`)

```dotenv
VITE_API_URL=http://localhost:8000
```

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Login and receive JWT |
| `GET` | `/api/v1/documents/` | List all documents |
| `POST` | `/api/v1/documents/upload` | Upload a document |
| `DELETE` | `/api/v1/documents/{id}` | Delete a document |
| `POST` | `/api/v1/chat/` | Send a chat message (RAG) |
| `GET` | `/api/v1/stats/` | Usage statistics |
| `GET` | `/api/v1/health/` | Health check |
| `GET` | `/api/v1/admin/users` | List users *(admin only)* |
| `WS` | `/ws/chat` | WebSocket chat stream |
| `WS` | `/ws/documents` | WebSocket document status |

Full interactive API docs: **http://localhost:8000/docs**

---

## 🔄 How It Works

```
User uploads document
        │
        ▼
  FastAPI endpoint
  saves file & DB record
        │
        ▼
  Celery worker picks up task
  ┌─────────────────────────┐
  │  Parse (PDF/DOCX/PPTX)  │
  │  Chunk text              │
  │  Generate embeddings     │  ← sentence-transformers (local, no API key needed)
  │  Upsert to Qdrant        │
  └─────────────────────────┘
        │
        ▼
  Document status → "ready"
  (pushed via WebSocket)

User sends chat message
        │
        ▼
  Semantic search in Qdrant
  → top-k relevant chunks
        │
        ▼
  Prompt + context → Gemini
        │
        ▼
  Streamed response to user
  (via WebSocket)
```

---

## 🧪 Testing

```bash
cd backend

# End-to-end API test
python test_e2e.py

# Qdrant pipeline test
python test_qdrant_pipeline.py
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|---|---|
| Documents stuck in `processing` | The Celery worker is not running. Start it in a separate terminal (Step 3 above). On restart, the app auto-recovers stuck documents. |
| `Connection refused` on Qdrant | Ensure the Qdrant container is running: `docker ps` |
| `GEMINI_API_KEY` errors | Verify your key at [aistudio.google.com](https://aistudio.google.com/apikey). Embeddings still work without it. |
| CORS errors in browser | Add your frontend URL to `CORS_ORIGINS` in `.env` |
| Slow first search | The embedding model downloads on first run — subsequent calls are fast. |

---

## 📄 License

This project is private. All rights reserved.

---

<div align="center">
  Built with ❤️ using FastAPI, React, Qdrant & Google Gemini
</div>
