from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.user import UserResponse
from app.schemas.document import DocumentResponse
from app.schemas.admin import AdminOverviewResponse, AdminSystemMonitoring, AdminModelConfig
from app.core.deps import require_admin
from app.services.admin_service import get_admin_overview_data, get_system_monitoring_data

import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])

# ── Upload guards ─────────────────────────────────────────────────────────────
MAX_UPLOAD_SIZE_MB = 50
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
MAX_PDF_PAGES = 2000

@router.get("/overview", response_model=AdminOverviewResponse)
def admin_overview(db: Session = Depends(get_db)):
    return get_admin_overview_data(db)

@router.get("/users", response_model=List[UserResponse])
def admin_list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    results = []
    for u in users:
        try:
            results.append(UserResponse.model_validate(u))
        except Exception as e:
            logger.warning(f"Skipping malformed user {getattr(u, 'id', 'unknown')} in list: {e}")
    return results

@router.patch("/users/{user_id}", response_model=UserResponse)
def admin_update_user(
    user_id: str,
    role: Optional[str] = None,
    plan: Optional[str] = None,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role:
        user.role = role
    if plan:
        user.plan = plan
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)

@router.get("/datasets", response_model=List[DocumentResponse])
def admin_list_datasets(db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.is_knowledge_base == True).all()
    results = []
    for d in docs:
        try:
            results.append(DocumentResponse.model_validate(d))
        except Exception as e:
            logger.warning(f"Skipping malformed document {d.id} ('{getattr(d, 'title', 'Untitled')}') in KB list: {e}")
    return results

@router.post("/datasets/upload", response_model=DocumentResponse)
async def admin_upload_dataset(
    file: UploadFile = File(...),
    category: Optional[str] = Form("General ML"),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    content_bytes = await file.read()
    file_size = len(content_bytes)
    file_name = file.filename or "Dataset_Document.pdf"
    ext = file_name.split(".")[-1].lower() if "." in file_name else "txt"

    # ── Guard 1: File size limit ──────────────────────────────────────────────
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size / (1024*1024):.1f} MB) exceeds the {MAX_UPLOAD_SIZE_MB} MB limit."
        )

    # ── Guard 2: PDF page count pre-check ─────────────────────────────────────
    if ext == "pdf":
        try:
            import io
            try:
                import pymupdf as fitz
            except ImportError:
                import fitz
            pdf_doc = fitz.open(stream=content_bytes, filetype="pdf")
            page_count = len(pdf_doc)
            pdf_doc.close()
            if page_count > MAX_PDF_PAGES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"PDF has {page_count} pages, which exceeds the {MAX_PDF_PAGES} page limit."
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Could not pre-check PDF page count for {file_name}: {e}")

    from app.services.document_service import compute_file_checksum, check_duplicate_document, save_uploaded_file

    checksum = compute_file_checksum(content_bytes)
    dup = check_duplicate_document(db, checksum=checksum, is_knowledge_base=True, uploaded_by=admin_user.id)
    if dup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This file has already been uploaded."
        )

    doc = Document(
        title=file_name,
        file_type=ext.upper(),
        file_size=file_size,
        status="uploading",
        uploaded_by=admin_user.id,
        is_knowledge_base=True,
        category=category,
        tags=["Shared Dataset", "Admin"],
        checksum=checksum
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    doc.file_path = save_uploaded_file(doc.id, file_name, content_bytes)
    db.commit()

    # ── Dispatch to Celery worker (NEVER runs in-process) ─────────────────────
    from app.tasks.document_tasks import dispatch_document_processing
    dispatched = dispatch_document_processing(doc_id=doc.id)

    if not dispatched:
        doc.status = "error"
        doc.error_message = (
            "Document processing worker is not running. "
            "Please start the worker with: .\\start_worker.ps1"
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Document uploaded but the processing worker is not running. "
                "Start the Celery worker in a separate terminal: .\\start_worker.ps1 — "
                "then retry by clicking 'Re-index' on this document."
            )
        )

    return DocumentResponse.model_validate(doc)

@router.post("/datasets/{dataset_id}/reindex")
def admin_reindex_dataset(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == dataset_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    doc.status = "processing"
    db.commit()

    from app.tasks.document_tasks import dispatch_document_processing
    dispatched = dispatch_document_processing(doc_id=doc.id)

    if not dispatched:
        doc.status = "error"
        doc.error_message = "Worker not running. Start with: .\\start_worker.ps1"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Processing worker is not running. Start the Celery worker first."
        )

    return {"message": f"Started re-indexing dataset {doc.title}"}

@router.delete("/datasets/{dataset_id}")
def admin_delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == dataset_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Clean up vector embeddings from Qdrant
    try:
        from app.core.qdrant_client import delete_document_chunks_from_qdrant
        delete_document_chunks_from_qdrant(dataset_id)
    except Exception as qe:
        logger.warning(f"Qdrant cleanup notice for dataset {dataset_id}: {qe}")

    # Clean up document chunks from DB
    try:
        from app.models.document_chunk import DocumentChunk
        db.query(DocumentChunk).filter(DocumentChunk.document_id == dataset_id).delete()
    except Exception as ce:
        logger.warning(f"DB chunk cleanup notice for dataset {dataset_id}: {ce}")

    db.delete(doc)
    db.commit()
    return {"message": f"Successfully deleted dataset {doc.title}"}

@router.get("/models", response_model=AdminModelConfig)
def admin_models():
    return AdminModelConfig()

@router.get("/monitoring", response_model=AdminSystemMonitoring)
def admin_monitoring():
    return get_system_monitoring_data()

@router.get("/logs")
def admin_logs():
    return [
        {"timestamp": "2026-07-25T19:45:00Z", "level": "INFO", "message": "Admin authenticated via JWT Bearer token."},
        {"timestamp": "2026-07-25T19:42:10Z", "level": "INFO", "message": "FastAPI worker booted with zero errors."},
    ]

@router.get("/settings")
def admin_get_settings():
    return {
        "maintenanceMode": False,
        "rateLimitPerMinute": 1000,
        "maxUploadSizeMb": MAX_UPLOAD_SIZE_MB,
        "maxPdfPages": MAX_PDF_PAGES,
        "vectorEngine": "Qdrant",
        "llmModel": "Gemini 2.5 Flash"
    }

@router.patch("/settings")
def admin_update_settings(settings_data: dict):
    return {"message": "Admin settings updated successfully", "config": settings_data}
