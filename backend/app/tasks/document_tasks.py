import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── Module-level Celery app ────────────────────────────────────────────────────
# Celery itself is imported unconditionally — it does NOT require Redis to import.
# Redis is only contacted when apply_async() / delay() is actually called.
# This lets the API process import this module safely even if Redis is offline.

_celery_app = None  # None = not yet initialised, False = checked and unavailable

def _build_celery_app():
    """
    Builds the Celery app once.  Returns the app on success, False if
    celery/redis is not importable or the import itself fails.
    Does NOT ping Redis — that happens lazily at dispatch time.
    """
    global _celery_app
    if _celery_app is not None:
        return _celery_app  # already built (or already known-bad)

    try:
        from celery import Celery
        from app.core.config import settings

        app = Celery(
            "knowledge_ai",
            broker=settings.REDIS_URL,
            backend=settings.REDIS_URL,
            include=["app.tasks.document_tasks"],   # tells the worker what to autodiscover
        )
        app.conf.update(
            task_serializer="json",
            accept_content=["json"],
            result_serializer="json",
            timezone="UTC",
            enable_utc=True,
            task_track_started=True,
            # Important on Windows: the prefork pool doesn't work; the worker
            # is started with --pool=solo.  These settings make tasks safer:
            task_acks_late=True,           # ack AFTER the task completes, not before
            worker_prefetch_multiplier=1,  # one task at a time per worker process
        )
        _celery_app = app
        return _celery_app
    except Exception as exc:
        logger.warning(f"[Celery] Could not build Celery app: {exc}")
        _celery_app = False
        return None


# Build the app at import time so the worker process can use the @task decorator
celery_app = _build_celery_app()


# ── Celery task ────────────────────────────────────────────────────────────────
# The @celery_app.task decorator only works when celery_app is a real Celery
# instance.  When celery is unavailable we define a plain function instead so
# the rest of the codebase can still import process_document_task.

if celery_app:
    @celery_app.task(
        name="app.tasks.document_tasks.process_document_task",
        bind=True,
        max_retries=3,
        default_retry_delay=10,
    )
    def process_document_task(self, doc_id: str):
        """
        Celery task: extract, chunk, embed, and upsert a document.
        Runs exclusively inside the Celery worker process — never inside uvicorn.
        """
        logger.info(f"[Worker] Starting document processing for doc_id='{doc_id}'")
        try:
            from app.services.document_service import process_document_background
            process_document_background(doc_id=doc_id)
            logger.info(f"[Worker] Finished document processing for doc_id='{doc_id}'")
        except Exception as exc:
            logger.error(f"[Worker] Error processing doc_id='{doc_id}': {exc}", exc_info=True)
            # Mark as error so the document doesn't stay stuck
            try:
                from app.services.document_service import mark_document_error
                mark_document_error(doc_id, f"Worker processing failed: {str(exc)[:200]}", full_error=str(exc))
            except Exception:
                pass
            # Retry up to max_retries times with exponential back-off
            raise self.retry(exc=exc, countdown=10 * (self.request.retries + 1))
else:
    # Celery not available — define a plain callable so the rest of the app
    # can still import process_document_task without crashing at import time.
    # This function is ONLY ever called by the Celery worker itself.
    # It is NEVER called from the API server process.
    def process_document_task(doc_id: str):  # type: ignore[misc]
        logger.info(f"[Fallback] Starting document processing for doc_id='{doc_id}'")
        from app.services.document_service import process_document_background
        process_document_background(doc_id=doc_id)
        logger.info(f"[Fallback] Finished document processing for doc_id='{doc_id}'")


# ── Safe dispatcher (thread fallback when Celery is unavailable) ───────────────

def _process_in_thread(doc_id: str):
    """Fallback: run document processing in a background thread when Celery is unavailable."""
    import threading

    def _worker():
        try:
            logger.info(f"[Thread Fallback] Starting document processing for doc_id='{doc_id}'")
            from app.services.document_service import process_document_background
            process_document_background(doc_id=doc_id)
            logger.info(f"[Thread Fallback] Finished document processing for doc_id='{doc_id}'")
        except Exception as exc:
            logger.error(f"[Thread Fallback] Error processing doc_id='{doc_id}': {exc}", exc_info=True)
            try:
                from app.services.document_service import mark_document_error
                mark_document_error(doc_id, f"Thread processing failed: {str(exc)[:200]}", full_error=str(exc))
            except Exception:
                pass

    t = threading.Thread(target=_worker, daemon=True)
    t.start()
    logger.info(f"[Thread Fallback] Dispatched doc_id='{doc_id}' to background thread (tid={t.ident})")


def dispatch_document_processing(doc_id: str) -> bool:
    """
    Dispatches document processing to the Celery worker.

    Returns True if the task was successfully queued via Celery or thread fallback.
    Returns False only if both Celery AND thread fallback fail.

    When Celery/Redis is unavailable, falls back to processing in a
    background thread so uploads still work without a separate worker.
    """
    if not celery_app:
        logger.warning(
            "[Dispatch] Celery/Redis unavailable. Falling back to thread-based processing."
        )
        try:
            _process_in_thread(doc_id)
            return True
        except Exception as exc:
            logger.error(f"[Dispatch] Thread fallback also failed: {exc}")
            return False

    try:
        # Check for at least one live worker process
        insp = celery_app.control.inspect(timeout=2.0)
        workers = insp.active() if insp else None

        if workers and isinstance(workers, dict) and len(workers) > 0:
            logger.info(
                f"[Dispatch] Live Celery worker(s) found: {list(workers.keys())}. "
                f"Sending doc '{doc_id}' via Celery."
            )
            process_document_task.apply_async(args=[doc_id])
            return True
        else:
            logger.warning(
                f"[Dispatch] Redis is reachable but NO active Celery worker found. "
                f"Falling back to thread-based processing for doc '{doc_id}'."
            )
            try:
                _process_in_thread(doc_id)
                return True
            except Exception as exc:
                logger.error(f"[Dispatch] Thread fallback failed: {exc}")
                return False
    except Exception as exc:
        logger.warning(
            f"[Dispatch] Celery dispatch failed ({exc}). "
            f"Falling back to thread-based processing for doc '{doc_id}'."
        )
        try:
            _process_in_thread(doc_id)
            return True
        except Exception as thread_exc:
            logger.error(f"[Dispatch] Thread fallback also failed: {thread_exc}")
            return False
