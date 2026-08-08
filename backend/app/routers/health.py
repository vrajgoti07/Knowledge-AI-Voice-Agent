"""
health.py — Real dependency health-check endpoint.

GET /api/v1/health returns:
  {
    "status": "ok" | "degraded",
    "db": true | false,
    "qdrant": true | false,
    "redis": true | false
  }

Each check is a genuine network probe, not just "module imported".
The overall status is "ok" only when all three are reachable.
"""

import logging
from fastapi import APIRouter
from sqlalchemy import text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["Health"])


def _check_db() -> bool:
    """Probe the relational DB with a trivial SELECT 1."""
    try:
        from app.db.session import SessionLocal
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            return True
        finally:
            db.close()
    except Exception as exc:
        logger.warning(f"[Health] DB check failed: {exc}")
        return False


import socket

def _probe_port(host: str, port: int, timeout: float = 0.5) -> bool:
    """Fast TCP socket probe to verify if a port is listening without waiting for TCP SYN timeouts."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False


def _check_qdrant() -> bool:
    """Probe Qdrant by listing collections (fast, read-only)."""
    try:
        from app.core.config import settings
        if not _probe_port(settings.QDRANT_HOST, settings.QDRANT_PORT, timeout=0.5):
            return False
        from qdrant_client import QdrantClient
        client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            timeout=1.0,
            check_compatibility=False
        )
        client.get_collections()
        return True
    except Exception as exc:
        logger.warning(f"[Health] Qdrant check failed: {exc}")
        return False


def _check_redis() -> bool:
    """Probe Redis with a PING."""
    try:
        from app.core.config import settings
        # Extract host and port from REDIS_URL if possible
        import urllib.parse
        parsed = urllib.parse.urlparse(settings.REDIS_URL)
        r_host = parsed.hostname or "localhost"
        r_port = parsed.port or 6379
        if not _probe_port(r_host, r_port, timeout=0.5):
            return False

        import redis as _redis
        r = _redis.from_url(settings.REDIS_URL, socket_connect_timeout=0.5, socket_timeout=0.5)
        r.ping()
        return True
    except Exception as exc:
        logger.warning(f"[Health] Redis check failed: {exc}")
        return False


@router.get("")
def health_check():
    """
    Returns the reachability status of all backend dependencies.
    Use this as a lightweight liveness + readiness probe.
    """
    db_ok     = _check_db()
    qdrant_ok = _check_qdrant()
    redis_ok  = _check_redis()

    all_ok = db_ok and qdrant_ok and redis_ok

    return {
        "status": "ok" if all_ok else "degraded",
        "db":     db_ok,
        "qdrant": qdrant_ok,
        "redis":  redis_ok,
    }


@router.get("/llm-status")
def llm_status():
    """
    Returns which LLM provider is currently active/healthy.
    Useful for debugging from Postman or the frontend.

    GET /api/v1/health/llm-status
    """
    try:
        from app.services.llm_provider import get_provider_status
        return get_provider_status()
    except Exception as e:
        logger.error(f"[Health] LLM status check failed: {e}")
        return {
            "providers": {},
            "active_provider": "unknown",
            "error": str(e),
        }

