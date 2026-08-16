import unittest
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.embedding_service import (
    split_into_sentences,
    build_contextual_chunk_header,
    build_embedding_input,
    chunk_text,
)
from app.services.retrieval_service import (
    reciprocal_rank_fusion,
    apply_parent_context_expansion,
)


from app.services.chat_service import classify_question_type
from app.services.retrieval_service import apply_diversity_cap
from app.services.llm_provider import sanitize_answer_text, _build_rag_prompt


class TestRAGPipelineUpgrade(unittest.TestCase):

    def test_sentence_splitting_with_abbreviations_and_decimals(self):
        text = "Dr. Smith presented Fig. 3.14 on machine learning. The model achieved 98.5% accuracy e.g. on MNIST! Next step is deployment."
        sentences = split_into_sentences(text)
        self.assertEqual(len(sentences), 3)
        self.assertTrue(sentences[0].startswith("Dr. Smith"))
        self.assertTrue(sentences[1].startswith("The model achieved"))
        self.assertTrue(sentences[2].startswith("Next step"))

    def test_contextual_chunk_headers(self):
        doc_title = "ML Guidebook"
        sec_title = "Backpropagation"
        sec_num = "3.2"
        chunk_content = "Gradients are calculated using the chain rule."

        header = build_contextual_chunk_header(doc_title, sec_title, sec_num)
        self.assertEqual(header, "[ML Guidebook — Backpropagation]")

        emb_input = build_embedding_input(doc_title, sec_title, sec_num, chunk_content)
        self.assertTrue(emb_input.startswith("[ML Guidebook — Backpropagation]\n"))
        self.assertTrue(emb_input.endswith(chunk_content))

    def test_structure_aware_chunking_with_parents(self):
        sample_doc = (
            "Chapter 1: Foundations of Artificial Intelligence\n\n"
            "Artificial intelligence is a broad field of computer science. "
            "It focuses on creating systems capable of performing tasks that typically require human intelligence.\n\n"
            "1.1 Machine Learning Overview\n\n"
            "Machine learning is a subfield of artificial intelligence. "
            "It enables computers to learn patterns from data without being explicitly programmed.\n\n"
            "Supervised learning algorithms infer a function from labeled training data."
        )

        chunks = chunk_text(sample_doc, page_number=1, doc_title="AI Intro")
        self.assertGreater(len(chunks), 0)
        # Verify parent fields are populated
        for c in chunks:
            self.assertIn("parent_id", c)
            self.assertIn("parent_content", c)
            self.assertIn("embedding_input", c)
            self.assertIn("page_start", c)
            self.assertIn("page_end", c)
            self.assertFalse(c["content"].startswith("[AI Intro —"))  # Raw content shouldn't have header

    def test_reciprocal_rank_fusion(self):
        dense_results = [
            {"document_id": "doc1", "chunk_index": 0, "content": "Dense top match"},
            {"document_id": "doc2", "chunk_index": 1, "content": "Dense second match"},
        ]
        bm25_results = [
            {"document_id": "doc2", "chunk_index": 1, "content": "Dense second match"},
            {"document_id": "doc3", "chunk_index": 0, "content": "BM25 keyword match"},
        ]

        fused = reciprocal_rank_fusion(dense_results, bm25_results, k=60, top_k=5)
        self.assertEqual(len(fused), 3)
        # doc2_1 is present in BOTH dense (rank 2) and bm25 (rank 1), so it should have the highest RRF score
        self.assertEqual(fused[0]["document_id"], "doc2")
        self.assertEqual(fused[0]["chunk_index"], 1)
        self.assertGreater(fused[0]["rrf_score"], fused[1]["rrf_score"])

    def test_parent_context_expansion_and_budget_cap(self):
        chunks = [
            {
                "document_id": "doc1",
                "chunk_index": 0,
                "content": "Child chunk 0 snippet.",
                "parent_id": "parent_section_1",
                "parent_content": "Full detailed parent section 1 covering the entire topic in 500 words.",
            },
            {
                "document_id": "doc1",
                "chunk_index": 1,
                "content": "Child chunk 1 snippet.",
                "parent_id": "parent_section_1",
                "parent_content": "Full detailed parent section 1 covering the entire topic in 500 words.",
            },
            {
                "document_id": "doc2",
                "chunk_index": 0,
                "content": "Child chunk 2 snippet.",
                "parent_id": "parent_section_2",
                "parent_content": "X" * 20000,  # Giant parent that would exceed 16k budget
            }
        ]

        expanded = apply_parent_context_expansion(chunks, max_context_chars=16000)
        self.assertEqual(len(expanded), 3)

        # Chunk 0 expands to parent section 1
        self.assertTrue(expanded[0]["is_parent_expanded"])
        self.assertEqual(expanded[0]["content"], chunks[0]["parent_content"])
        self.assertEqual(expanded[0]["child_content"], chunks[0]["content"])

        # Chunk 1 belongs to SAME parent_id, so it does not redundantly duplicate the parent block
        self.assertFalse(expanded[1]["is_parent_expanded"])
        self.assertEqual(expanded[1]["content"], chunks[1]["content"])

        # Chunk 2 has oversized parent content that exceeds 16k budget, so it falls back to child chunk
        self.assertFalse(expanded[2]["is_parent_expanded"])
        self.assertEqual(expanded[2]["content"], chunks[2]["content"])

    def test_question_classifier_heuristics(self):
        self.assertEqual(classify_question_type("what is machine learning?"), "DEFINITION")
        self.assertEqual(classify_question_type("define artificial intelligence"), "DEFINITION")
        self.assertEqual(classify_question_type("explain how backpropagation works"), "EXPLANATION")
        self.assertEqual(classify_question_type("why does gradient descent converge?"), "EXPLANATION")
        self.assertEqual(classify_question_type("list the types of machine learning"), "LIST")
        self.assertEqual(classify_question_type("what are the steps to train a model?"), "LIST")
        self.assertEqual(classify_question_type("difference between supervised and unsupervised learning"), "COMPARISON")
        self.assertEqual(classify_question_type("compare decision trees and random forests"), "COMPARISON")
        self.assertEqual(classify_question_type("what is the formula for gradient descent?"), "FORMULA")
        self.assertEqual(classify_question_type("how to calculate cross entropy loss"), "FORMULA")
        self.assertEqual(classify_question_type("summarize this document"), "SUMMARY")
        self.assertEqual(classify_question_type("overview of chapter 3"), "SUMMARY")

    def test_per_document_diversity_cap(self):
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
        doc1_count = sum(1 for c in selected if c["document_id"] == "doc1")
        self.assertLessEqual(doc1_count, 3)
        doc2_count = sum(1 for c in selected if c["document_id"] == "doc2")
        doc3_count = sum(1 for c in selected if c["document_id"] == "doc3")
        self.assertEqual(doc2_count, 3)
        self.assertEqual(doc3_count, 1)
        self.assertEqual(len(selected), 7)

    def test_sanitize_answer_text_preserves_citations(self):
        raw_response = "Machine Learning is a subset of AI [1]. Backpropagation calculates gradients [2]."
        sanitized = sanitize_answer_text(raw_response)
        self.assertIn("[1]", sanitized)
        self.assertIn("[2]", sanitized)


if __name__ == "__main__":
    unittest.main()
