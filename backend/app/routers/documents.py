from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse, DocumentUpdate
from app.core.deps import get_current_user, get_current_user_optional

router = APIRouter(prefix="/documents", tags=["Documents"])

# ── Upload guards ─────────────────────────────────────────────────────────────
MAX_UPLOAD_SIZE_MB = 50
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
MAX_PDF_PAGES = 2000


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    is_knowledge_base: bool = Form(False),
    category: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content_bytes = await file.read()
    file_size = len(content_bytes)

    # ── Guard 1: File size limit ──────────────────────────────────────────────
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size / (1024*1024):.1f} MB) exceeds the {MAX_UPLOAD_SIZE_MB} MB limit."
        )

    file_name = file.filename or "Uploaded_Document.pdf"
    ext = file_name.split(".")[-1].lower() if "." in file_name else "txt"

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
            import logging
            logging.getLogger(__name__).warning(f"Could not pre-check PDF page count for {file_name}: {e}")

    from app.services.document_service import compute_file_checksum, check_duplicate_document, save_uploaded_file

    checksum = compute_file_checksum(content_bytes)
    dup = check_duplicate_document(db, checksum=checksum, is_knowledge_base=is_knowledge_base, uploaded_by=current_user.id)
    if dup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This file has already been uploaded."
        )

    # Immediately create Document record with status="uploading"
    doc = Document(
        title=file_name,
        file_type=ext.upper(),
        file_size=file_size,
        status="uploading",
        uploaded_by=current_user.id,
        is_knowledge_base=is_knowledge_base,
        category=category,
        tags=["Vector Index", "Uploaded"],
        checksum=checksum
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    doc.file_path = save_uploaded_file(doc.id, file_name, content_bytes)
    db.commit()

    # ── Dispatch to Celery worker (falls back to thread if no worker) ────────────
    from app.tasks.document_tasks import dispatch_document_processing
    dispatched = dispatch_document_processing(doc_id=doc.id)

    if not dispatched:
        doc.status = "error"
        doc.error_message = (
            "Document processing failed to start. "
            "Please try again or contact support."
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Document uploaded but processing could not be started. "
                "Please try again."
            )
        )

    return DocumentResponse.model_validate(doc)


@router.post("/{document_id}/reindex")
def reindex_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or (doc.uploaded_by != current_user.id and not current_user.role == "admin"):
        raise HTTPException(status_code=404, detail="Document not found")

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

    return {"message": f"Started re-indexing document {doc.title}"}


import logging
logger = logging.getLogger(__name__)

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    scope: str = Query("personal", pattern="^(personal|shared|all)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if scope == "personal":
        query = query.filter(Document.uploaded_by == current_user.id)
    elif scope == "shared":
        query = query.filter(Document.is_knowledge_base == True)
    else:
        query = query.filter((Document.uploaded_by == current_user.id) | (Document.is_knowledge_base == True))

    docs = query.order_by(Document.created_at.desc()).all()
    results = []
    for d in docs:
        try:
            results.append(DocumentResponse.model_validate(d))
        except Exception as e:
            logger.warning(f"Skipping malformed document {d.id} ('{getattr(d, 'title', 'Untitled')}') in list: {e}")
    return results


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.uploaded_by != current_user.id and not doc.is_knowledge_base and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return DocumentResponse.model_validate(doc)


@router.get("/{document_id}/file")
def get_document_file(
    document_id: str,
    token: Optional[str] = Query(None),
    header_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    from fastapi.responses import FileResponse
    from app.core.security import decode_token

    user = header_user
    if not user and token:
        try:
            payload = decode_token(token)
            if payload and payload.get("type") == "access":
                user_id = payload.get("sub")
                if user_id:
                    user = db.query(User).filter(User.id == user_id).first()
        except Exception:
            pass

    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # If document is in shared knowledge base, allow viewing without restriction
    if doc.is_knowledge_base:
        pass
    else:
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required to view this private document")
        if doc.uploaded_by != user.id and getattr(user, "role", "") != "admin":
            raise HTTPException(status_code=403, detail="Access denied to this document file")

    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Physical document file not found on disk")

    ext = (doc.file_type or "pdf").lower()
    media_types = {
        "pdf": "application/pdf",
        "txt": "text/plain",
        "md": "text/markdown",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }
    media_type = media_types.get(ext, "application/octet-stream")
    filename = doc.title if doc.title else f"document.{ext}"

    return FileResponse(
        path=doc.file_path,
        media_type=media_type,
        filename=filename,
        content_disposition_type="inline"
    )


@router.patch("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: str,
    req: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    if req.title is not None:
        doc.title = req.title
    if req.tags is not None:
        doc.tags = req.tags
    if req.category is not None:
        doc.category = req.category

    db.commit()
    db.refresh(doc)
    return DocumentResponse.model_validate(doc)


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")

    # Clean up physical file on disk
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as fe:
            logger.warning(f"File removal notice for document {document_id}: {fe}")

    # Clean up vector embeddings from Qdrant
    try:
        from app.core.qdrant_client import delete_document_chunks_from_qdrant
        delete_document_chunks_from_qdrant(document_id)
    except Exception as qe:
        logger.warning(f"Qdrant cleanup notice for document {document_id}: {qe}")

    # Clean up document chunks from DB
    try:
        from app.models.document_chunk import DocumentChunk
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
    except Exception as ce:
        logger.warning(f"DB chunk cleanup notice for document {document_id}: {ce}")

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}


@router.get("/{document_id}/status")
def get_document_status(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": doc.status, "chunks": doc.chunks}
