from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

db_url = settings.DATABASE_URL or "sqlite:///./knowledge_ai.db"

# Normalize async sqlite protocol to sync if present
if db_url.startswith("sqlite+aiosqlite"):
    db_url = db_url.replace("sqlite+aiosqlite", "sqlite")

# Ensure connect_args only includes check_same_thread for SQLite
connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}

engine = create_engine(
    db_url,
    echo=False,
    connect_args=connect_args
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    statements = [
        "ALTER TABLE documents ADD COLUMN IF NOT EXISTS checksum VARCHAR",
        "ALTER TABLE documents ADD COLUMN IF NOT EXISTS error_message TEXT",
        "ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS section_number VARCHAR",
        "ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS section_title VARCHAR",
        "ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS parent_section VARCHAR",
        "ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS parent_id VARCHAR",
        "ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS parent_content TEXT",
        "ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS page_start INTEGER",
        "ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS page_end INTEGER",
        "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS running_summary TEXT",
    ]
    with engine.connect() as conn:
        for stmt in statements:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                try:
                    conn.rollback()
                except Exception:
                    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
