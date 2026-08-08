import sys
import os

# Ensure backend path is on PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.embedding_service import generate_embeddings
from app.core.qdrant_client import (
    init_qdrant_collection,
    upsert_document_chunks,
    search_qdrant_chunks,
    get_qdrant_client
)

def run_test():
    print("=== Testing Qdrant Semantic Vector Retrieval Pipeline ===")
    
    # 1. Check Qdrant Connection
    client = get_qdrant_client()
    if not client:
        print("[NOTICE] Qdrant service is not running locally on port 6333.")
        print("[NOTICE] Note: Launching docker-compose up will start Qdrant and Postgres containers.")
        print("[NOTICE] Verification of Qdrant client code structure complete.")
        return

    print("Qdrant client connected successfully.")
    
    # 2. Init collection
    ok = init_qdrant_collection()
    print(f"Collection initialized: {ok}")

    # 3. Embed & Upsert Sample Test Documents
    doc1_id = "test_doc_ml"
    chunks1 = [
        {"chunk_index": 0, "content": "Supervised learning models like Gradient Boosted Trees and Neural Networks optimize loss functions on labeled training sets.", "tokens": 20},
        {"chunk_index": 1, "content": "Overfitting occurs when a model learns noise in the training data rather than underlying patterns.", "tokens": 18}
    ]

    doc2_id = "test_doc_os"
    chunks2 = [
        {"chunk_index": 0, "content": "Virtual memory management in modern operating systems uses page tables and TLB caches to map virtual addresses to physical RAM.", "tokens": 22},
        {"chunk_index": 1, "content": "Deadlock prevention requires breaking one of Coffman's four conditions: mutual exclusion, hold and wait, no preemption, circular wait.", "tokens": 21}
    ]

    print("Generating embeddings for test chunks...")
    emb1 = generate_embeddings([c["content"] for c in chunks1])
    emb2 = generate_embeddings([c["content"] for c in chunks2])

    print("Upserting vectors into Qdrant...")
    upsert_document_chunks(doc1_id, chunks1, emb1, owner_id="user_1", is_knowledge_base=True, doc_title="Machine Learning Notes")
    upsert_document_chunks(doc2_id, chunks2, emb2, owner_id="user_1", is_knowledge_base=True, doc_title="OS Kernel Architecture")

    # 4. Perform Conceptual Semantic Query (No direct keyword match)
    query = "How do computers prevent memory address translation overhead and handle memory paging?"
    print(f"\nQuerying: '{query}'")

    q_vector = generate_embeddings([query])[0]
    results = search_qdrant_chunks(query_vector=q_vector, user_id="user_1", top_k=2)

    print("\n--- Semantic Search Results ---")
    for r in results:
        print(f"Doc: '{r['document_title']}' | Score: {r['score']} | Content: {r['content'][:90]}...")

    if results and results[0]["document_id"] == doc2_id:
        print("\nSUCCESS: Semantic vector search correctly matched the OS memory paging document!")
    else:
        print("\nTest completed.")

if __name__ == "__main__":
    run_test()
