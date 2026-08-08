#!/usr/bin/env python
"""
reindex_all.py — Rebuild vector store for all uploaded documents
================================================================
Run from the backend/ directory:

    python reindex_all.py [--mode all|failed|doc_id]

Options:
    --mode all        Re-index ALL documents with status 'ready' or 'error'
    --mode failed     Re-index ONLY documents with status 'error'
    --mode <doc_id>   Re-index a specific document by its ID

This script:
1. Queries SQLite for documents matching the mode filter
2. Deletes existing Qdrant vector points for each document
3. Deletes existing DB chunk records for each document
4. Re-runs the full ingestion pipeline (extract → chunk → embed → upsert)
5. Prints a summary with chunk counts vs page counts per document

NEW chunking strategy (after this fix):
  - Stage 1: Split on section headers (Chapter X, 2.1 headings, ## Markdown)
  - Stage 2: Paragraph-aware grouping (~350 words, 75-word overlap)
  - Stage 3: Flat word-count fallback

WHY RE-INDEX?
  The old bad-quality chunks (large page-level chunks with no section splitting)
  are still sitting in Qdrant. Re-indexing replaces them with tighter, more
  specific chunks so the re-ranker has better candidates to work with.

ESTIMATED TIME:
  ~2-5 min per 100-page PDF depending on CPU speed.
  A 900-page PDF may take ~20-30 min total.
"""
import os
import sys
import time
import argparse
import logging

# ── Set up path so we can import the app from backend/ ───────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("reindex_all")


def main():
    parser = argparse.ArgumentParser(description="Re-index documents with updated chunking strategy")
    parser.add_argument(
        "--mode",
        default="all",
        help="'all' | 'failed' | '<specific_doc_id>' (default: all)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be re-indexed without actually doing it"
    )
    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("Knowledge AI — Re-indexing Pipeline")
    logger.info("=" * 60)
    logger.info(f"Mode: {args.mode} | Dry-run: {args.dry_run}")

    # ── Import app modules ────────────────────────────────────────────────────
    try:
        from app.db.session import SessionLocal
        from app.models.document import Document
        from app.models.document_chunk import DocumentChunk
        from app.core.qdrant_client import delete_document_chunks_from_qdrant, init_qdrant_collection
        from app.services.document_service import process_document_background
        from app.services.embedding_service import EMBEDDING_MODEL_NAME
    except ImportError as e:
        logger.error(f"Import failed — make sure you're running from backend/ directory: {e}")
        sys.exit(1)

    logger.info(f"Embedding model that will be used: {EMBEDDING_MODEL_NAME}")

    db = SessionLocal()
    try:
        # ── 1. Select target documents ────────────────────────────────────────
        if args.mode == "all":
            docs = db.query(Document).filter(
                Document.status.in_(["ready", "error"])
            ).order_by(Document.created_at.asc()).all()
        elif args.mode == "failed":
            docs = db.query(Document).filter(
                Document.status == "error"
            ).order_by(Document.created_at.asc()).all()
        else:
            # Treat as specific doc_id
            doc = db.query(Document).filter(Document.id == args.mode).first()
            docs = [doc] if doc else []

        if not docs:
            logger.info("No documents found matching the filter. Nothing to re-index.")
            return

        logger.info(f"\nDocuments to re-index: {len(docs)}")
        logger.info("-" * 60)
        for d in docs:
            logger.info(
                f"  [{d.status:10s}] {d.title[:60]:60s} | "
                f"chunks={d.chunks or 0:5} | file_path={'EXISTS' if d.file_path and os.path.exists(d.file_path) else 'MISSING'}"
            )
        logger.info("-" * 60)

        if args.dry_run:
            logger.info("[DRY RUN] No changes made. Remove --dry-run to proceed.")
            return

        # ── 2. Initialize Qdrant collection ───────────────────────────────────
        try:
            init_qdrant_collection()
            logger.info("Qdrant collection ready.")
        except Exception as qe:
            logger.warning(f"Qdrant init warning: {qe} — will attempt to continue.")

        # ── 3. Re-index each document ─────────────────────────────────────────
        results = []
        for i, doc in enumerate(docs, 1):
            t_start = time.time()
            logger.info(f"\n[{i}/{len(docs)}] Re-indexing: '{doc.title}' (id={doc.id})")

            if not doc.file_path or not os.path.exists(doc.file_path):
                logger.error(f"  SKIP — file not found on disk: {doc.file_path}")
                results.append({
                    "title": doc.title,
                    "status": "SKIPPED",
                    "reason": "file missing on disk"
                })
                continue

            # Read file from disk
            try:
                with open(doc.file_path, "rb") as f:
                    content_bytes = f.read()
                logger.info(f"  Read {len(content_bytes):,} bytes from disk.")
            except Exception as re_e:
                logger.error(f"  SKIP — cannot read file: {re_e}")
                results.append({"title": doc.title, "status": "SKIPPED", "reason": str(re_e)})
                continue

            # Run full pipeline synchronously (in-process, no Celery)
            try:
                process_document_background(
                    doc_id=doc.id,
                    content_bytes=content_bytes,
                    file_name=doc.title,
                    ext=doc.file_type.lower() if doc.file_type else None,
                )
                elapsed = time.time() - t_start

                # Reload doc to get updated chunk count
                db.expire(doc)
                db.refresh(doc)

                # Get max page to compute chunks_per_page ratio
                from sqlalchemy import func
                max_page = db.query(func.max(DocumentChunk.page_number))\
                    .filter(DocumentChunk.document_id == doc.id).scalar() or 1
                chunk_count = db.query(func.count(DocumentChunk.id))\
                    .filter(DocumentChunk.document_id == doc.id).scalar() or 0
                cpp = round(chunk_count / max(max_page, 1), 2)
                flag = "✅ OK" if 0.5 <= cpp <= 6 else ("⚠ LOW" if cpp < 0.5 else "⚠ HIGH")

                logger.info(
                    f"  ✅ Done in {elapsed:.1f}s | "
                    f"chunks={chunk_count} | max_page={max_page} | "
                    f"chunks/page={cpp} {flag} | status={doc.status}"
                )
                results.append({
                    "title": doc.title,
                    "status": doc.status,
                    "chunks": chunk_count,
                    "max_page": max_page,
                    "chunks_per_page": cpp,
                    "flag": flag,
                    "elapsed_s": round(elapsed, 1),
                })
            except Exception as proc_err:
                elapsed = time.time() - t_start
                logger.error(f"  ❌ FAILED after {elapsed:.1f}s: {proc_err}")
                results.append({
                    "title": doc.title,
                    "status": "FAILED",
                    "reason": str(proc_err)[:200],
                })

        # ── 4. Summary ────────────────────────────────────────────────────────
        logger.info("\n" + "=" * 60)
        logger.info("RE-INDEX SUMMARY")
        logger.info("=" * 60)
        ok = [r for r in results if r.get("status") == "ready"]
        failed = [r for r in results if r.get("status") in ("FAILED", "SKIPPED", "error")]
        logger.info(f"  Total: {len(results)} | Success: {len(ok)} | Failed: {len(failed)}")
        logger.info("")
        for r in results:
            if r.get("status") == "ready":
                logger.info(
                    f"  ✅ {r['title'][:55]:55s} | "
                    f"chunks={r.get('chunks', '?'):5} | "
                    f"pages~{r.get('max_page', '?'):4} | "
                    f"cpp={r.get('chunks_per_page', '?'):5} {r.get('flag', '')} | "
                    f"{r.get('elapsed_s', '?')}s"
                )
            else:
                logger.warning(
                    f"  ❌ {r['title'][:55]:55s} | "
                    f"status={r.get('status')} | {r.get('reason', '')[:60]}"
                )
        logger.info("=" * 60)
        logger.info(
            "Re-indexing complete. Restart the backend server for the updated "
            "chunking to take effect on new uploads."
        )

    finally:
        db.close()


if __name__ == "__main__":
    main()
