import os
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.db.seed import seed_database
from app.routers import auth, documents, chat, admin, settings as settings_router, stats, health, debug as debug_router
from app.websockets import chat_ws, documents_ws

from app.core.qdrant_client import init_qdrant_collection

def auto_migrate_db():
    """Auto-migrates missing columns on SQLite tables."""
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        if "documents" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("documents")]
            with engine.begin() as conn:
                if "file_path" not in columns:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN file_path TEXT"))
                if "checksum" not in columns:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN checksum VARCHAR"))
                if "error_message" not in columns:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN error_message TEXT"))
    except Exception as e:
        print(f"Auto-migration notice: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    auto_migrate_db()
    seed_database()
    try:
        init_qdrant_collection()
    except Exception as qerr:
        print(f"Qdrant startup notice: {qerr}")

    # Pre-warm the embedding model + cross-encoder at startup
    try:
        import asyncio
        from app.services.embedding_service import eager_load_model
        from app.services.retrieval_service import warm_cross_encoder

        async def _warmup_models():
            await asyncio.to_thread(eager_load_model)
            await asyncio.to_thread(warm_cross_encoder)

        asyncio.create_task(_warmup_models())
    except Exception as emb_err:
        print(f"Model pre-warm notice: {emb_err}")

    # Validate LLM providers at startup and log health banner
    try:
        from app.services.llm_provider import validate_providers_at_startup
        validate_providers_at_startup()
    except Exception as llm_err:
        print(f"LLM provider validation notice: {llm_err}")

    # Startup recovery: re-process any documents stuck in 'processing'/'uploading'
    # Runs asynchronously in background so server startup completes instantly.
    def _run_startup_recovery():
        try:
            from app.db.session import SessionLocal
            from app.models.document import Document

            recovery_db = SessionLocal()
            try:
                stuck_docs = recovery_db.query(Document).filter(
                    Document.status.in_(["processing", "uploading"])
                ).all()

                if stuck_docs:
                    print(f"[Startup Recovery] Found {len(stuck_docs)} stuck document(s). Attempting dispatch...")
                    for d in stuck_docs:
                        d.status = "uploading"
                    recovery_db.commit()

                    for d in stuck_docs:
                        try:
                            from app.tasks.document_tasks import dispatch_document_processing
                            dispatch_document_processing(doc_id=d.id)
                        except Exception:
                            pass
                else:
                    print("[Startup Recovery] No stuck documents found.")
            finally:
                recovery_db.close()
        except Exception as startup_err:
            print(f"[Startup Recovery] Notice: {startup_err}")

    try:
        import asyncio
        asyncio.create_task(asyncio.to_thread(_run_startup_recovery))
    except Exception as exc:
        print(f"[Startup Recovery] Dispatch notice: {exc}")

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration matching frontend dev server (supports localhost, 127.0.0.1, LAN IPs)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(settings_router.router, prefix=settings.API_V1_STR)
app.include_router(stats.router, prefix=settings.API_V1_STR)
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(debug_router.router, prefix=settings.API_V1_STR)

# Mount WebSockets
app.include_router(chat_ws.router)
app.include_router(documents_ws.router)

@app.get("/")
def root():
    return {"message": "Knowledge AI FastAPI Backend Running", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting Knowledge AI FastAPI server on http://{host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
