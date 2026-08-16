import unittest
from unittest.mock import patch, MagicMock
from app.services.llm_provider import (
    rewrite_query_with_context,
    generate_conversation_summary,
    _build_rag_prompt,
    _build_general_prompt,
    generate_answer,
)
from app.services.chat_service import generate_rag_response


class DummyMessage:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content


class TestConversationMemory(unittest.TestCase):

    def test_first_message_returns_unmodified(self):
        """First message with empty history must return original query verbatim without calling LLM."""
        query = "what is gradient descent?"
        rewritten = rewrite_query_with_context(query, conversation_history=[])
        self.assertEqual(rewritten, query)

        rewritten_none = rewrite_query_with_context(query, conversation_history=None)
        self.assertEqual(rewritten_none, query)

    @patch("app.services.llm_provider._call_llm")
    def test_follow_up_query_rewriting(self, mock_llm):
        """Follow-up 'give me an example' is rewritten to include previous topic context."""
        mock_llm.return_value = ("Give an example of gradient descent being used to optimize a machine learning model", "groq")

        history = [
            DummyMessage("user", "what is gradient descent?"),
            DummyMessage("assistant", "Gradient descent is a first-order iterative optimization algorithm for finding a local minimum of a differentiable function."),
        ]

        rewritten = rewrite_query_with_context("give me an example", conversation_history=history)
        self.assertIn("gradient descent", rewritten.lower())
        self.assertEqual(rewritten, "Give an example of gradient descent being used to optimize a machine learning model")
        mock_llm.assert_called_once()

    @patch("app.services.llm_provider._call_llm")
    def test_multi_turn_chaining(self, mock_llm):
        """Multi-turn follow-up 'why does that matter in practice?' retains topic context across turns."""
        mock_llm.return_value = ("Why does gradient descent optimization matter in practical machine learning applications?", "groq")

        history = [
            DummyMessage("user", "what is gradient descent?"),
            DummyMessage("assistant", "Gradient descent is an optimization algorithm used to train machine learning models."),
            DummyMessage("user", "give me an example"),
            DummyMessage("assistant", "An example is training linear regression where gradient descent adjusts weights to minimize mean squared error."),
        ]

        rewritten = rewrite_query_with_context("why does that matter in practice?", conversation_history=history)
        self.assertEqual(rewritten, "Why does gradient descent optimization matter in practical machine learning applications?")
        self.assertIn("gradient descent", rewritten.lower())

    @patch("app.services.llm_provider._call_llm")
    def test_unrelated_question_preserved_as_standalone(self, mock_llm):
        """Topic shift to an unrelated question is preserved as standalone."""
        mock_llm.return_value = ("what is a decision tree?", "groq")

        history = [
            DummyMessage("user", "what is gradient descent?"),
            DummyMessage("assistant", "Gradient descent is an optimization algorithm..."),
        ]

        rewritten = rewrite_query_with_context("what is a decision tree?", conversation_history=history)
        self.assertEqual(rewritten, "what is a decision tree?")

    @patch("app.services.llm_provider._call_llm")
    def test_generate_conversation_summary(self, mock_llm):
        """Older conversation turns are summarized in 2-3 sentences."""
        mock_llm.return_value = ("The user asked about gradient descent and received an explanation of weight updates and learning rates.", "groq")

        messages = [
            DummyMessage("user", f"Question {i}") for i in range(10)
        ]

        summary = generate_conversation_summary(messages)
        self.assertEqual(summary, "The user asked about gradient descent and received an explanation of weight updates and learning rates.")
        mock_llm.assert_called_once()

    def test_rag_prompt_structure_with_history_and_summary(self):
        """RAG prompt clearly separates conversation history, running summary, and retrieved documents."""
        prompt = _build_rag_prompt(
            query="give me an example",
            context_str="[1] Gradient descent is used in linear regression...",
            question_type="EXPLANATION",
            history_text="User: what is gradient descent?\nAssistant: Gradient descent is an algorithm...",
            running_summary="Earlier discussion focused on supervised learning definitions."
        )

        self.assertIn("SYSTEM: You are Knowledge AI", prompt)
        self.assertIn("SUMMARY OF PREVIOUS CONVERSATION:", prompt)
        self.assertIn("Earlier discussion focused on supervised learning definitions.", prompt)
        self.assertIn("CONVERSATION HISTORY (for context only):", prompt)
        self.assertIn("User: what is gradient descent?", prompt)
        self.assertIn("DOCUMENT EXCERPTS (your actual source of truth):", prompt)
        self.assertIn("Gradient descent is used in linear regression...", prompt)
        self.assertIn("CURRENT QUESTION:\ngive me an example", prompt)

    def test_general_prompt_structure_with_history_and_summary(self):
        """General prompt includes conversation history and running summary."""
        prompt = _build_general_prompt(
            query="tell me more",
            question_type="EXPLANATION",
            history_text="User: what is python?\nAssistant: Python is a programming language.",
            running_summary="Discussion on high-level languages."
        )

        self.assertIn("SYSTEM: You are Knowledge AI", prompt)
        self.assertIn("SUMMARY OF PREVIOUS CONVERSATION:", prompt)
        self.assertIn("CONVERSATION HISTORY (for context only):", prompt)
        self.assertIn("CURRENT QUESTION:\ntell me more", prompt)


if __name__ == "__main__":
    unittest.main()
