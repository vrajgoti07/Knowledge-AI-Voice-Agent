# ============================================================
# document_service.py — Document Extraction & Chunking Service
# Includes strict PPTX text-only extraction (ignoring all binary media/images)
# Supports persistent disk storage, multi-mode PDF extraction, and re-indexing
# ============================================================
import os
import io
import re
import logging
import concurrent.futures
from typing import Optional
from fastapi import UploadFile
import psutil
from sqlalchemy.orm import Session
from app.models.document import Document
import hashlib
from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import chunk_text, generate_embeddings
from app.core.qdrant_client import upsert_document_chunks, delete_document_chunks_from_qdrant
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

EMBEDDING_TIMEOUT_SECONDS = 600  # 10 minutes watchdog ceiling
MAX_CHUNKS_PER_DOCUMENT = 5000  # Safety cap to prevent runaway memory
MIN_AVAILABLE_RAM_MB = 512       # Skip embedding if RAM is below this threshold

def compute_file_checksum(content_bytes: bytes) -> str:
    """Computes SHA-256 checksum hex string for given bytes."""
    return hashlib.sha256(content_bytes).hexdigest()

def check_duplicate_document(db: Session, checksum: str, is_knowledge_base: bool, uploaded_by: str) -> Optional[Document]:
    """Queries DB to check if a document with identical checksum exists in scope (ignoring documents in error state)."""
    if is_knowledge_base:
        return db.query(Document).filter(
            Document.is_knowledge_base == True,
            Document.checksum == checksum,
            Document.status != "error"
        ).first()
    return db.query(Document).filter(
        Document.uploaded_by == uploaded_by,
        Document.is_knowledge_base == False,
        Document.checksum == checksum,
        Document.status != "error"
    ).first()

def mark_document_error(doc_id: str, summary: str, full_error: Optional[str] = None):
    """Safely updates document status to 'error' and records error message using a fresh DB session."""
    fresh_db = SessionLocal()
    try:
        doc = fresh_db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = "error"
            doc.summary = summary[:250]
            doc.error_message = full_error or summary
            fresh_db.commit()
            logger.info(f"[{doc_id}] Successfully marked document status as 'error' using fresh DB session.")
    except Exception as err:
        logger.error(f"[{doc_id}] Failed to mark document status as error: {err}")
        fresh_db.rollback()
    finally:
        fresh_db.close()

UPLOAD_DIR = os.path.abspath(os.path.join(os.getcwd(), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_uploaded_file(doc_id: str, filename: str, content_bytes: bytes) -> str:
    """Saves uploaded file bytes to disk in uploads directory."""
    safe_name = f"{doc_id}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(content_bytes)
    return file_path


def extract_text_from_pptx(file_bytes: bytes, filename: str) -> tuple[str, list[dict], bool]:
    """
    Strictly extracts text from a PPTX file using python-pptx, ignoring all binary media, images, and non-text shapes.
    Returns (full_text, pages_data, is_success).
    """
    try:
        from pptx import Presentation
        prs = Presentation(io.BytesIO(file_bytes))
        text_content = []
        pages_data = []

        for idx, slide in enumerate(prs.slides, start=1):
            slide_text = []

            # Check slide title
            title_text = ""
            if slide.shapes.title and hasattr(slide.shapes.title, "text") and slide.shapes.title.text:
                title_text = slide.shapes.title.text.strip()
                if title_text:
                    slide_text.append(f"Slide {idx}: {title_text}")
            else:
                slide_text.append(f"Slide {idx}")

            for shape in slide.shapes:
                if hasattr(shape, "has_text_frame") and shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        cleaned = paragraph.text.strip()
                        if cleaned and not cleaned.startswith("PNG") and not "IHDR" in cleaned and not "IDAT" in cleaned:
                            prefix = "  " * paragraph.level + "• " if paragraph.level > 0 else ""
                            if cleaned not in slide_text and cleaned != title_text:
                                slide_text.append(f"{prefix}{cleaned}")
                elif hasattr(shape, "has_table") and shape.has_table:
                    table_rows = []
                    for row in shape.table.rows:
                        row_cells = [c.text.strip() for c in row.cells if c.text.strip()]
                        if row_cells:
                            table_rows.append(" | ".join(row_cells))
                    if table_rows:
                        slide_text.append("Table:\n" + "\n".join(table_rows))

            if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                notes = slide.notes_slide.notes_text_frame.text.strip()
                if notes:
                    slide_text.append(f"Notes: {notes}")

            if slide_text:
                slide_str = "\n".join(slide_text).strip()
                if slide_str:
                    text_content.append(slide_str)
                    pages_data.append({"page_number": idx, "text": slide_str})

        full_extracted = "\n\n".join(text_content).strip()
        if not full_extracted:
            full_extracted = f"PowerPoint document {filename} contains no readable text."
            return full_extracted, [], False

        return full_extracted, pages_data, True

    except Exception as e:
        logger.error(f"Failed to parse PPTX {filename}: {e}")
        error_msg = f"Failed to parse PPTX {filename}: {str(e)}"
        return error_msg, [], False


def extract_text_from_file(file_bytes: bytes, filename: str, ext: str) -> tuple[str, list[dict], bool]:
    """
    Extracts text from file bytes based on extension.
    Returns (full_extracted_text, list_of_page_dicts, is_success).
    """
    pages_data = []
    extracted_text = ""
    is_success = True

    if ext in ["txt", "md", "csv", "json", "py", "js", "ts", "tsx", "html", "css", "yaml", "yml", "xml", "log"]:
        try:
            extracted_text = file_bytes.decode("utf-8", errors="ignore").replace("\x00", "")
            if not extracted_text.strip():
                extracted_text = f"File {filename} is empty."
                is_success = False
            else:
                pages_data.append({"page_number": 1, "text": extracted_text})
        except Exception as e:
            logger.warning(f"Plain text decoding failed for {filename}: {e}")
            extracted_text = f"Content decoding failed for {filename}: {e}"
            is_success = False

    elif ext == "pdf":
        try:
            full_pages = []
            # Engine 1: PyMuPDF (pymupdf>=1.24 / fitz compat) - Extremely fast and robust for text/blocks
            try:
                try:
                    import pymupdf as fitz  # pymupdf >= 1.24 (new canonical name)
                except ImportError:
                    import fitz  # legacy fitz package fallback
                pdf_doc = fitz.open(stream=file_bytes, filetype="pdf")
                logger.info(f"PDF Extraction (PyMuPDF): Opened '{filename}' ({len(file_bytes)} bytes, {len(pdf_doc)} pages)")
                for idx, page in enumerate(pdf_doc, start=1):
                    page_text = (page.get_text("text") or "").strip()
                    if not page_text:
                        blocks = page.get_text("blocks")
                        b_texts = [b[4].strip() for b in blocks if len(b) >= 5 and b[4].strip()]
                        page_text = "\n".join(b_texts).strip()
                    
                    page_text = page_text.replace("\x00", "").strip()
                    if page_text:
                        pages_data.append({"page_number": idx, "text": page_text})
                        full_pages.append(page_text)
            except Exception as fe:
                logger.warning(f"PyMuPDF extraction failed for {filename}: {fe}")

            # Engine 2: Fallback to pypdf if PyMuPDF returned no text pages
            if not full_pages:
                pages_data.clear()
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                logger.info(f"PDF Extraction (pypdf fallback): Opened '{filename}' with {len(reader.pages)} pages.")
                for idx, page in enumerate(reader.pages, start=1):
                    try:
                        page_text = (page.extract_text() or "").strip()
                        if not page_text:
                            try:
                                page_text = (page.extract_text(extraction_mode="layout") or "").strip()
                            except Exception:
                                page_text = ""
                        page_text = page_text.replace("\x00", "").strip()
                        if page_text:
                            pages_data.append({"page_number": idx, "text": page_text})
                            full_pages.append(page_text)
                    except Exception as pe:
                        logger.warning(f"pypdf extraction failed on page {idx} for {filename}: {pe}")

            extracted_text = "\n\n".join(full_pages).strip()
            if not extracted_text:
                logger.error(f"PDF document '{filename}' yielded 0 extractable characters across all pages.")
                extracted_text = f"PDF document '{filename}' uploaded, but contains no extractable text stream (file may be empty, image-based, or scanned)."
                is_success = False
            else:
                is_success = True
                logger.info(f"PDF Extraction Success: Extracted {len(extracted_text)} characters across {len(pages_data)} pages for '{filename}'.")
        except Exception as e:
            logger.error(f"PDF extraction failed completely for {filename}: {e}")
            extracted_text = f"PDF extraction failed for {filename}: {e}"
            is_success = False

    elif ext in ["docx", "doc"]:
        try:
            import docx
            doc_file = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [p.text.strip().replace("\x00", "") for p in doc_file.paragraphs if p.text.strip()]
            extracted_text = "\n\n".join(paragraphs).strip()
            if not extracted_text:
                extracted_text = f"DOCX document {filename} uploaded (no readable paragraphs found)."
                is_success = False
            else:
                pages_data.append({"page_number": 1, "text": extracted_text})
        except Exception as e:
            logger.error(f"DOCX extraction failed for {filename}: {e}")
            extracted_text = f"DOCX extraction failed for {filename}: {e}"
            is_success = False

    elif ext in ["pptx", "ppt"]:
        return extract_text_from_pptx(file_bytes, filename)

    else:
        extracted_text = f"Unsupported file format ({ext}) for document {filename}."
        is_success = False

    return extracted_text, pages_data, is_success


def is_boilerplate_text(content: str, page_number: int) -> bool:
    """
    Detects if a page/chunk contains copyright, legal, or publishing frontmatter.
    """
    if not content:
        return False
    t_lower = content.lower()
    legal_terms = [
        "isbn", "copyright", "all rights reserved", "printed in",
        "publisher", "proofreader", "editor:", "cataloging-in-publication",
        "trademarks", "library of congress", "sans serif", "typeset", "published by"
    ]
    matches = sum(1 for kw in legal_terms if kw in t_lower)
    if (page_number or 1) <= 2 and matches >= 1:
        return True
    if matches >= 2:
        return True
    return False


def process_document_background(
    doc_id: str,
    content_bytes: Optional[bytes] = None,
    file_name: Optional[str] = None,
    ext: Optional[str] = None
):
    """
    Background worker job:
    Status transition: uploading -> processing -> ready / error.
    Extracts text, builds chunks, writes to DB.
    """
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            logger.error(f"[{doc_id}] Document record not found in database.")
            return

        doc.status = "processing"
        db.commit()

        # If content_bytes not supplied (e.g. on re-indexing), read from disk storage
        if not content_bytes:
            if doc.file_path and os.path.exists(doc.file_path):
                with open(doc.file_path, "rb") as f:
                    content_bytes = f.read()
            else:
                logger.error(f"[{doc_id}] No stored file found on disk for document {doc_id}")
                doc.status = "error"
                doc.summary = "No original file found on disk for re-indexing."
                db.commit()
                return

        fname = file_name or doc.title
        fext = ext or (fname.split(".")[-1].lower() if "." in fname else doc.file_type.lower())
        logger.info(f"[{doc_id}] Starting ingestion pipeline for '{fname}' ({len(content_bytes)} bytes, format={fext}).")

        # Compute and store checksum if missing
        if not doc.checksum and content_bytes:
            doc.checksum = compute_file_checksum(content_bytes)

        # Save file to persistent storage if file_path not yet set
        if not doc.file_path:
            doc.file_path = save_uploaded_file(doc.id, fname, content_bytes)

        extracted_text, pages_data, is_success = extract_text_from_file(content_bytes, fname, fext)
        logger.info(f"[{doc_id}] Extraction complete: is_success={is_success}, text_len={len(extracted_text)}, pages={len(pages_data)}.")

        # Clear any existing chunks for clean re-indexing
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()
        delete_document_chunks_from_qdrant(doc.id)

        total_tokens = 0
        chunk_index_counter = 0
        created_chunks_list = []

        if is_success and pages_data:
            logger.info(f"[{doc_id}] Starting text splitting on {len(pages_data)} page blocks...")
            for page_info in pages_data:
                p_num = page_info["page_number"]
                p_text = page_info["text"]
                c_list = chunk_text(p_text)

                for c in c_list:
                    is_fm = is_boilerplate_text(c["content"], p_num)
                    chunk_obj = DocumentChunk(
                        document_id=doc.id,
                        chunk_index=chunk_index_counter,
                        content=c["content"],
                        tokens=c["tokens"],
                        page_number=p_num
                    )
                    db.add(chunk_obj)
                    created_chunks_list.append({
                        "chunk_index": chunk_index_counter,
                        "content": c["content"],
                        "tokens": c["tokens"],
                        "page_number": p_num,
                        "is_frontmatter": is_fm
                    })
                    total_tokens += c["tokens"]
                    chunk_index_counter += 1

                    # Safety cap: stop creating chunks if we hit the limit
                    if chunk_index_counter >= MAX_CHUNKS_PER_DOCUMENT:
                        logger.warning(f"[{doc_id}] Hit chunk limit ({MAX_CHUNKS_PER_DOCUMENT}). Truncating remaining pages.")
                        break
                if chunk_index_counter >= MAX_CHUNKS_PER_DOCUMENT:
                    break

            logger.info(f"[{doc_id}] Text splitting completed: created {chunk_index_counter} chunks (total_tokens={total_tokens}).")

            # ── CRITICAL FIX: Commit chunks to DB NOW before embedding ──────
            # This ensures the SQL keyword fallback in retrieval_service.py
            # can find document chunks even if Qdrant is offline or embedding fails.
            try:
                db.commit()
                logger.info(f"[{doc_id}] Committed {chunk_index_counter} chunks to DB (SQL fallback available).")
            except Exception as commit_err:
                logger.error(f"[{doc_id}] Failed to commit chunks to DB: {commit_err}")
                db.rollback()
        else:
            logger.warning(f"[{doc_id}] Skipping text chunking because extraction succeeded={is_success} and pages_data count={len(pages_data)}.")

        embedding_success = True
        embedding_error_reason = ""

        # Generate embeddings and upsert to Qdrant vector database with a watchdog timeout
        if created_chunks_list:
            # ── Memory safety check before loading the embedding model ────────
            try:
                mem = psutil.virtual_memory()
                available_mb = mem.available / (1024 * 1024)
                logger.info(f"[{doc_id}] Available RAM before embedding: {available_mb:.0f} MB")
                if available_mb < MIN_AVAILABLE_RAM_MB:
                    embedding_success = False
                    embedding_error_reason = (
                        f"Skipped embedding: only {available_mb:.0f} MB RAM available "
                        f"(minimum {MIN_AVAILABLE_RAM_MB} MB required). "
                        f"SQL fallback search is active."
                    )
                    logger.warning(f"[{doc_id}] {embedding_error_reason}")
                    created_chunks_list = []  # Skip the embedding block below
            except Exception as mem_err:
                logger.warning(f"[{doc_id}] Could not check available RAM: {mem_err}")

        if created_chunks_list:
            def _embed_and_upsert():
                chunk_texts = [c["content"] for c in created_chunks_list]
                logger.info(f"[{doc_id}] Generating embeddings for {len(chunk_texts)} chunks...")
                embeddings = generate_embeddings(chunk_texts)
                logger.info(f"[{doc_id}] Upserting {len(embeddings)} vectors into Qdrant collection...")
                upsert_document_chunks(
                    doc_id=doc.id,
                    chunks=created_chunks_list,
                    embeddings=embeddings,
                    owner_id=doc.uploaded_by,
                    is_knowledge_base=doc.is_knowledge_base,
                    doc_title=doc.title
                )

            try:
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(_embed_and_upsert)
                    future.result(timeout=EMBEDDING_TIMEOUT_SECONDS)
                logger.info(f"[{doc_id}] Qdrant vector indexing successfully completed.")
            except concurrent.futures.TimeoutError:
                embedding_success = False
                embedding_error_reason = "Embedding/indexing timed out (exceeded 10 minute limit)."
                logger.error(f"[{doc_id}] {embedding_error_reason}")
            except Exception as qerr:
                embedding_success = False
                embedding_error_reason = f"Embedding/indexing failed: {qerr}"
                logger.error(f"[{doc_id}] {embedding_error_reason}")

        # ── RELAXED CONDITION: Mark 'ready' if extraction + chunking succeeded ──
        # Even if Qdrant embedding failed, chunks are committed to DB (SQL fallback works).
        # Only mark error if text extraction itself produced 0 usable chunks.
        if is_success and chunk_index_counter > 0:
            doc.content = extracted_text
            doc.chunks = chunk_index_counter
            doc.tokens = total_tokens
            doc.status = "ready"
            doc.summary = extracted_text[:250] + "..." if len(extracted_text) > 250 else extracted_text
            # Store embedding error as a warning note, not a blocking error
            if not embedding_success:
                doc.error_message = f"[Qdrant Warning] {embedding_error_reason} — SQL fallback search is active."
                logger.warning(f"[{doc_id}] Qdrant indexing failed but document is still queryable via SQL fallback.")
            else:
                doc.error_message = None
            db.commit()
            db.refresh(doc)
            logger.info(f"[{doc_id}] Ingestion pipeline finished: status='{doc.status}', chunks={doc.chunks}, tokens={doc.tokens}, qdrant_ok={embedding_success}.")
        else:
            err_detail = embedding_error_reason or f"Parsing Error: 0 readable text chunks found. {extracted_text[:200]}"
            mark_document_error(doc_id, err_detail, full_error=err_detail)
    except Exception as e:
        logger.error(f"Background processing error for doc {doc_id}: {e}")
        mark_document_error(doc_id, f"Processing Exception: {str(e)[:200]}", full_error=str(e))
    finally:
        try:
            db.close()
        except Exception:
            pass

