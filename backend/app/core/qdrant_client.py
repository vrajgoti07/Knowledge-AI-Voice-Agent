import logging
import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from app.core.config import settings

logger = logging.getLogger("knowledge_ai.qdrant")

COLLECTION_NAME = "knowledge_ai_chunks"
VECTOR_DIM = 384  # Dimension for all-MiniLM-L6-v2

_qdrant_client: Optional[QdrantClient] = None

def get_qdrant_client() -> Optional[QdrantClient]:
    """
    Returns a singleton QdrantClient instance or None if connection fails.
    """
    global _qdrant_client
    if _qdrant_client is None:
        try:
            _qdrant_client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
                timeout=10.0,
                check_compatibility=False
            )
        except Exception as e:
            logger.warning(f"Failed to connect to Qdrant at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}: {e}")
            return None
    return _qdrant_client


def init_qdrant_collection() -> bool:
    """
    Ensures that the Qdrant vector collection exists with 384 dimensions and Cosine distance.
    """
    client = get_qdrant_client()
    if not client:
        logger.warning("Qdrant client unavailable. Vector collection check skipped.")
        return False

    try:
        collections = client.get_collections().collections
        exists = any(c.name == COLLECTION_NAME for c in collections)
        if not exists:
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=qmodels.VectorParams(
                    size=VECTOR_DIM,
                    distance=qmodels.Distance.COSINE
                )
            )
            logger.info(f"Created Qdrant collection '{COLLECTION_NAME}' (dim={VECTOR_DIM}, Cosine)")
        else:
            logger.info(f"Qdrant collection '{COLLECTION_NAME}' is ready.")
        return True
    except Exception as e:
        logger.error(f"Error initializing Qdrant collection '{COLLECTION_NAME}': {e}")
        return False


def upsert_document_chunks(
    doc_id: str,
    chunks: List[Dict[str, Any]],
    embeddings: List[List[float]],
    owner_id: str,
    is_knowledge_base: bool = False,
    doc_title: str = ""
) -> bool:
    """
    Upserts chunk vector embeddings and metadata into Qdrant.
    """
    client = get_qdrant_client()
    if not client:
        logger.warning("Qdrant client unavailable. Vector upsert skipped.")
        return False

    if len(chunks) != len(embeddings):
        logger.error("Mismatch between chunk count and embedding count.")
        return False

    points = []
    for c, emb in zip(chunks, embeddings):
        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{doc_id}_{c['chunk_index']}"))
        payload = {
            "document_id": str(doc_id),
            "chunk_index": c["chunk_index"],
            "owner_id": str(owner_id),
            "is_knowledge_base": bool(is_knowledge_base),
            "is_frontmatter": bool(c.get("is_frontmatter", False)),
            "document_title": str(doc_title),
            "page_number": c.get("page_number", 1),
            "text": c["content"],
            "tokens": c.get("tokens", 0)
        }
        points.append(qmodels.PointStruct(
            id=point_id,
            vector=emb,
            payload=payload
        ))

    try:
        init_qdrant_collection()
        client.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )
        logger.info(f"Upserted {len(points)} vector chunks into Qdrant for document {doc_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to upsert vectors to Qdrant for document {doc_id}: {e}")
        return False


def delete_document_chunks_from_qdrant(doc_id: str) -> bool:
    """
    Deletes all vector points associated with document_id from Qdrant.
    """
    client = get_qdrant_client()
    if not client:
        return False

    try:
        client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=qmodels.FilterSelector(
                filter=qmodels.Filter(
                    must=[
                        qmodels.FieldCondition(
                            key="document_id",
                            match=qmodels.MatchValue(value=str(doc_id))
                        )
                    ]
                )
            )
        )
        logger.info(f"Deleted vector chunks from Qdrant for document {doc_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete vectors from Qdrant for document {doc_id}: {e}")
        return False


def search_qdrant_chunks(
    query_vector: List[float],
    user_id: str,
    top_k: int = 8,
    context_document_ids: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Searches Qdrant for top_k nearest chunks matching user_id permissions.
    """
    client = get_qdrant_client()
    if not client:
        logger.warning("Qdrant client unavailable. Vector search skipped.")
        return []

    # Ownership & knowledge base filter: owner_id == user_id OR is_knowledge_base == True
    access_filter = qmodels.Filter(
        should=[
            qmodels.FieldCondition(key="owner_id", match=qmodels.MatchValue(value=str(user_id))),
            qmodels.FieldCondition(key="is_knowledge_base", match=qmodels.MatchValue(value=True))
        ]
    )

    # Optional context document IDs filter
    if context_document_ids:
        doc_conditions = [
            qmodels.FieldCondition(key="document_id", match=qmodels.MatchValue(value=str(did)))
            for did in context_document_ids
        ]
        doc_filter = qmodels.Filter(should=doc_conditions)
        query_filter = qmodels.Filter(must=[access_filter, doc_filter])
    else:
        query_filter = access_filter

    try:
        if hasattr(client, "query_points"):
            res = client.query_points(
                collection_name=COLLECTION_NAME,
                query=query_vector,
                query_filter=query_filter,
                limit=top_k
            )
            search_result = getattr(res, "points", res)
        elif hasattr(client, "search"):
            search_result = client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                query_filter=query_filter,
                limit=top_k
            )
        else:
            search_result = []

        results = []
        for hit in search_result:
            p = getattr(hit, "payload", {}) or {}
            results.append({
                "document_id": p.get("document_id"),
                "document_title": p.get("document_title", ""),
                "content": p.get("text", ""),
                "page": p.get("page_number", 1),
                "chunk_index": p.get("chunk_index", 0),
                "is_frontmatter": p.get("is_frontmatter", False),
                "score": round(float(getattr(hit, "score", 0.0)), 4)
            })

        return results
    except Exception as e:
        logger.error(f"Error performing vector search in Qdrant: {e}")
        return []
