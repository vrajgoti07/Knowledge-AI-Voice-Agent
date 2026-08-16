import os
import sys
import uuid
from app.db.session import SessionLocal, init_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.services.chat_service import generate_rag_response
from app.services.llm_provider import rewrite_query_with_context, generate_conversation_summary, validate_providers_at_startup

def run_live_verification():
    print("=" * 70)
    print("RUNNING LIVE CONVERSATION MEMORY VERIFICATION SCENARIOS")
    print("=" * 70)

    validate_providers_at_startup()
    init_db()
    db = SessionLocal()

    try:
        # Get or create a test user
        user = db.query(User).first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email="test_user@example.com",
                name="Test User",
                hashed_password="dummy_password"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # ── SCENARIO 1: First Question in New Thread ───────────────────
        print("\n[Scenario 1] Asking: 'what is gradient descent?'")
        conv1 = Conversation(user_id=user.id, title="Test Gradient Descent")
        db.add(conv1)
        db.commit()
        db.refresh(conv1)

        # Add initial user message
        msg1_user = Message(conversation_id=conv1.id, role="user", content="what is gradient descent?")
        db.add(msg1_user)
        db.flush()

        ans1, cits1, meta1 = generate_rag_response(
            db=db,
            user_id=user.id,
            conversation_id=conv1.id,
            user_query="what is gradient descent?",
            conversation_history=[]
        )
        msg1_ai = Message(conversation_id=conv1.id, role="assistant", content=ans1)
        db.add(msg1_ai)
        db.commit()

        print(f"  Rewritten Query: '{meta1.get('rewritten_query')}'")
        print(f"  Answer Snippet: {ans1[:120]}...")
        assert meta1.get('rewritten_query') == "what is gradient descent?", "First message should not be rewritten"

        # ── SCENARIO 2: Follow-up 'give me an example' ─────────────────
        print("\n[Scenario 2] Following up with: 'give me an example'")
        history_s2 = [msg1_user, msg1_ai]

        msg2_user = Message(conversation_id=conv1.id, role="user", content="give me an example")
        db.add(msg2_user)
        db.flush()

        ans2, cits2, meta2 = generate_rag_response(
            db=db,
            user_id=user.id,
            conversation_id=conv1.id,
            user_query="give me an example",
            conversation_history=history_s2
        )
        msg2_ai = Message(conversation_id=conv1.id, role="assistant", content=ans2)
        db.add(msg2_ai)
        db.commit()

        print(f"  Exact Rewritten Query: '{meta2.get('rewritten_query')}'")
        print(f"  Answer Snippet: {ans2[:150]}...")
        assert "gradient descent" in meta2.get('rewritten_query', '').lower() or "gradient" in meta2.get('rewritten_query', '').lower(), "Rewrite must resolve gradient descent"

        # ── SCENARIO 3: Multi-turn Follow-up 'why does that matter in practice?' ──
        print("\n[Scenario 3] Following up with 3rd turn: 'why does that matter in practice?'")
        history_s3 = [msg1_user, msg1_ai, msg2_user, msg2_ai]

        msg3_user = Message(conversation_id=conv1.id, role="user", content="why does that matter in practice?")
        db.add(msg3_user)
        db.flush()

        ans3, cits3, meta3 = generate_rag_response(
            db=db,
            user_id=user.id,
            conversation_id=conv1.id,
            user_query="why does that matter in practice?",
            conversation_history=history_s3
        )
        msg3_ai = Message(conversation_id=conv1.id, role="assistant", content=ans3)
        db.add(msg3_ai)
        db.commit()

        print(f"  Exact Rewritten Query: '{meta3.get('rewritten_query')}'")
        print(f"  Answer Snippet: {ans3[:150]}...")

        # ── SCENARIO 4: Unrelated Question in same thread 'what is a decision tree?' ──
        print("\n[Scenario 4] Topic shift in same thread: 'what is a decision tree?'")
        history_s4 = [msg1_user, msg1_ai, msg2_user, msg2_ai, msg3_user, msg3_ai]

        ans4, cits4, meta4 = generate_rag_response(
            db=db,
            user_id=user.id,
            conversation_id=conv1.id,
            user_query="what is a decision tree?",
            conversation_history=history_s4
        )
        print(f"  Rewritten Query: '{meta4.get('rewritten_query')}'")
        print(f"  Answer Snippet: {ans4[:120]}...")
        assert "decision tree" in meta4.get('rewritten_query', '').lower()

        # ── SCENARIO 5: Brand-New Thread with 'give me an example' (No History) ──
        print("\n[Scenario 5] Brand new thread first message: 'give me an example'")
        conv2 = Conversation(user_id=user.id, title="Empty Thread")
        db.add(conv2)
        db.commit()

        ans5, cits5, meta5 = generate_rag_response(
            db=db,
            user_id=user.id,
            conversation_id=conv2.id,
            user_query="give me an example",
            conversation_history=[]
        )
        print(f"  Rewritten Query (Empty History): '{meta5.get('rewritten_query')}'")
        print(f"  Answer Snippet: {ans5[:120]}...")
        assert meta5.get('rewritten_query') == "give me an example"

        # ── SCENARIO 6: Reopening an old conversation from history ───────
        print("\n[Scenario 6] Reopening conv1 from DB and checking loaded messages...")
        reopened_msgs = db.query(Message).filter(Message.conversation_id == conv1.id).order_by(Message.created_at.asc()).all()
        print(f"  Total messages loaded for conv1: {len(reopened_msgs)}")
        assert len(reopened_msgs) >= 6

        # ── SCENARIO 7: Long conversation (12+ messages) & Running Summary ──
        print("\n[Scenario 7] Simulating long conversation (12+ messages) with running summary...")
        for i in range(4, 10):
            u_m = Message(conversation_id=conv1.id, role="user", content=f"Step {i}: Explain detail on learning rate tuning.")
            a_m = Message(conversation_id=conv1.id, role="assistant", content=f"Detail {i}: Learning rate controls the step size in gradient descent optimization.")
            db.add(u_m)
            db.add(a_m)
        db.commit()

        total_msgs = db.query(Message).filter(Message.conversation_id == conv1.id).order_by(Message.created_at.asc()).all()
        print(f"  Total messages now: {len(total_msgs)}")
        summary = generate_conversation_summary(total_msgs[:-8])
        print(f"  Generated Running Summary: '{summary}'")
        conv1.running_summary = summary
        db.commit()

        # Follow up referencing earlier discussion
        ans7, cits7, meta7 = generate_rag_response(
            db=db,
            user_id=user.id,
            conversation_id=conv1.id,
            user_query="what was our main conclusion about the step size?",
            conversation_history=total_msgs[-8:],
            running_summary=conv1.running_summary
        )
        print(f"  Rewritten Query with Summary: '{meta7.get('rewritten_query')}'")
        print(f"  Answer Snippet: {ans7[:150]}...")

        print("\n" + "=" * 70)
        print("ALL 7 VERIFICATION SCENARIOS COMPLETED SUCCESSFULLY!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_live_verification()
