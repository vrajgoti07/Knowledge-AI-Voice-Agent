from app.services.chat_service import classify_question_type
from app.services.retrieval_service import apply_diversity_cap
from app.services.llm_provider import sanitize_answer_text, _build_rag_prompt


def test_question_classifier_heuristics():
    assert classify_question_type("what is machine learning?") == "DEFINITION"
    assert classify_question_type("define artificial intelligence") == "DEFINITION"
    
    assert classify_question_type("explain how backpropagation works") == "EXPLANATION"
    assert classify_question_type("why does gradient descent converge?") == "EXPLANATION"
    
    assert classify_question_type("list the types of machine learning") == "LIST"
    assert classify_question_type("what are the steps to train a model?") == "LIST"
    
    assert classify_question_type("difference between supervised and unsupervised learning") == "COMPARISON"
    assert classify_question_type("compare decision trees and random forests") == "COMPARISON"
    
    assert classify_question_type("what is the formula for gradient descent?") == "FORMULA"
    assert classify_question_type("how to calculate cross entropy loss") == "FORMULA"
    
    assert classify_question_type("summarize this document") == "SUMMARY"
    assert classify_question_type("overview of chapter 3") == "SUMMARY"


def test_per_document_diversity_cap():
    chunks = [
        {"document_id": "doc1", "score": 0.95, "content": "c1"},
        {"document_id": "doc1", "score": 0.94, "content": "c2"},
        {"document_id": "doc1", "score": 0.93, "content": "c3"},
        {"document_id": "doc1", "score": 0.92, "content": "c4"},
        {"document_id": "doc1", "score": 0.91, "content": "c5"},
        {"document_id": "doc2", "score": 0.90, "content": "c6"},
        {"document_id": "doc2", "score": 0.89, "content": "c7"},
        {"document_id": "doc2", "score": 0.88, "content": "c8"},
        {"document_id": "doc2", "score": 0.87, "content": "c9"},
        {"document_id": "doc3", "score": 0.86, "content": "c10"},
    ]

    selected = apply_diversity_cap(chunks, max_per_doc=3, top_k=8)
    
    # Verify max 3 from doc1
    doc1_count = sum(1 for c in selected if c["document_id"] == "doc1")
    assert doc1_count <= 3
    
    # Verify doc2 and doc3 are included
    doc2_count = sum(1 for c in selected if c["document_id"] == "doc2")
    doc3_count = sum(1 for c in selected if c["document_id"] == "doc3")
    assert doc2_count == 3
    assert doc3_count == 1
    assert len(selected) == 7


def test_sanitize_answer_text_preserves_citations():
    raw_response = "Machine Learning is a subset of AI [1]. Backpropagation calculates gradients [2]."
    sanitized = sanitize_answer_text(raw_response)
    assert "[1]" in sanitized
    assert "[2]" in sanitized


def test_system_prompt_includes_type_instructions():
    prompt = _build_rag_prompt("what is ML?", "excerpt text", question_type="DEFINITION")
    assert "QUESTION TYPE: DEFINITION" in prompt
    assert "Strict maximum length: 80 words" in prompt
    assert "CITATION PLACEMENT" in prompt
    assert "SOURCES LINE" in prompt

