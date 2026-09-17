import asyncio
import json
import time
import logging
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.db.session import SessionLocal
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.citation import Citation
from app.services.chat_service import generate_rag_response
from app.services.llm_provider import generate_conversation_summary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("/chat/{conversation_id}")
async def websocket_chat(websocket: WebSocket, conversation_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            query = payload.get("content", "")
            if not query.strip():
                continue

            db = SessionLocal()
            try:
                conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
                if not conv:
                    await websocket.send_text(json.dumps({"type": "error", "content": "Conversation not found"}))
                    continue

                # 1. Fetch recent messages BEFORE adding new user message
                recent_messages = (
                    db.query(Message)
                    .filter(Message.conversation_id == conv.id)
                    .order_by(Message.created_at.desc())
                    .limit(8)
                    .all()
                )
                recent_messages.reverse()

                # 2. Context window summary for long threads (run in thread to avoid blocking)
                total_msgs_count = db.query(Message).filter(Message.conversation_id == conv.id).count()
                if total_msgs_count > 8 and (total_msgs_count % 10 == 0 or not conv.running_summary):
                    try:
                        all_prior_msgs = (
                            db.query(Message)
                            .filter(Message.conversation_id == conv.id)
                            .order_by(Message.created_at.asc())
                            .all()
                        )
                        msgs_to_summarize = all_prior_msgs[:-8] if len(all_prior_msgs) > 8 else all_prior_msgs
                        if msgs_to_summarize:
                            new_summary = await asyncio.to_thread(
                                generate_conversation_summary, msgs_to_summarize, conv.running_summary
                            )
                            if new_summary:
                                conv.running_summary = new_summary
                                db.flush()
                    except Exception as sum_err:
                        logger.warning(f"Failed to generate running summary in WS: {sum_err}")

                user_msg = Message(
                    conversation_id=conv.id,
                    role="user",
                    content=query
                )
                db.add(user_msg)
                db.flush()

                if conv.title == "New Research Session" or conv.title == "New Conversation":
                    conv.title = query[:40] + "..." if len(query) > 40 else query

                # ── RAG call (run in thread to avoid blocking the async event loop) ──
                t_start = time.time()
                try:
                    answer_text, citations_list, rag_metadata = await asyncio.to_thread(
                        generate_rag_response,
                        db,
                        conv.user_id,
                        conv.id,
                        query,
                        None,  # context_document_ids
                        recent_messages,
                        getattr(conv, 'running_summary', None),
                    )
                    t_end = time.time()
                    logger.info(
                        f"[WS Chat] RAG response for conv={conversation_id} took {t_end - t_start:.2f}s "
                        f"(provider={rag_metadata.get('provider', '?')})"
                    )
                except Exception as rag_err:
                    t_end = time.time()
                    logger.error(f"[WS Chat] RAG error after {t_end - t_start:.2f}s for conv={conversation_id}: {rag_err}", exc_info=True)
                    answer_text = "I encountered an issue generating a response for your document query. Please try again."
                    citations_list = []
                    rag_metadata = {"provider": "error", "degraded": True}

                ai_msg = Message(
                    conversation_id=conv.id,
                    role="assistant",
                    content=answer_text
                )
                db.add(ai_msg)
                db.flush()

                cit_responses = []
                for c in citations_list:
                    cit_obj = Citation(
                        message_id=ai_msg.id,
                        document_id=c["document_id"],
                        document_title=c["document_title"],
                        excerpt=c["excerpt"],
                        page=c["page"],
                        chunk=c["chunk"],
                        score=c["score"]
                    )
                    db.add(cit_obj)
                    db.flush()
                    cit_responses.append({
                        "id": cit_obj.id,
                        "documentId": c["document_id"],
                        "documentTitle": c["document_title"],
                        "excerpt": c["excerpt"],
                        "page": c["page"]
                    })

                conv.updated_at = datetime.utcnow()
                db.commit()

                # Stream token-by-token real answer (degraded text still streams for TTS)
                tokens = answer_text.split(" ")
                for i, token in enumerate(tokens):
                    sep = " " if i < len(tokens) - 1 else ""
                    await websocket.send_text(json.dumps({"type": "token", "content": token + sep}))
                    await asyncio.sleep(0.02)

                # Send real citations + provider metadata on completion
                await websocket.send_text(json.dumps({
                    "type": "done",
                    "citations": cit_responses,
                    "provider": rag_metadata.get("provider", "unknown"),
                    "degraded": rag_metadata.get("degraded", False),
                    "speechText": rag_metadata.get("speech_text", answer_text),
                }))
            finally:
                db.close()
    except WebSocketDisconnect:
        pass

