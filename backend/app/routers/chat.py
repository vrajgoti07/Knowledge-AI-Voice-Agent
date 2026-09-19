import logging
import uuid
import asyncio
import io
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.session import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.citation import Citation
from app.schemas.chat import ConversationResponse, MessageResponse, CitationResponse, CreateMessageRequest
from app.core.deps import get_current_user
from app.services.chat_service import generate_rag_response
from app.services.llm_provider import generate_conversation_summary
from app.services.export_service import generate_conversation_pdf, slugify

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/conversations", tags=["Chat"])

def format_iso_utc(dt: datetime = None) -> str:
    if not dt:
        dt = datetime.utcnow()
    s = dt.isoformat()
    if not s.endswith("Z") and "+" not in s:
        s += "Z"
    return s

@router.get("", response_model=List[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convs = db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc()).all()

    response_list = []
    for conv in convs:
        try:
            msgs = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()

            msg_responses = []
            for m in msgs:
                try:
                    cits = db.query(Citation).filter(Citation.message_id == m.id).all()
                    cit_responses = []
                    for c in cits:
                        try:
                            cit_responses.append(CitationResponse.model_validate(c))
                        except Exception as ce:
                            logger.warning(f"Skipping malformed citation {getattr(c, 'id', 'unknown')}: {ce}")

                    msg_responses.append(
                        MessageResponse(
                            id=m.id,
                            role=m.role,
                            content=m.content,
                            citations=cit_responses,
                            timestamp=m.created_at.strftime("%I:%M %p") if getattr(m, 'created_at', None) else "",
                            model=m.model,
                            tokens=m.tokens
                        )
                    )
                except Exception as me:
                    logger.warning(f"Skipping malformed message {getattr(m, 'id', 'unknown')}: {me}")

            created_str = format_iso_utc(getattr(conv, 'created_at', None))
            updated_str = format_iso_utc(getattr(conv, 'updated_at', None))

            response_list.append(
                ConversationResponse(
                    id=conv.id,
                    title=conv.title or "Untitled Conversation",
                    messages=msg_responses,
                    documentIds=conv.document_ids or [],
                    createdAt=created_str,
                    updatedAt=updated_str,
                    model=conv.model,
                    pinned=conv.pinned or False,
                    running_summary=getattr(conv, 'running_summary', None),
                )
            )
        except Exception as e:
            logger.warning(f"Skipping malformed conversation {getattr(conv, 'id', 'unknown')} in list: {e}")

    return response_list

@router.post("", response_model=ConversationResponse)
def create_conversation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = Conversation(
        user_id=current_user.id,
        title="New Research Session"
    )
    db.add(conv)
    db.flush()

    greeting = Message(
        conversation_id=conv.id,
        role="assistant",
        content="Hello! I am your Knowledge AI research assistant powered by Gemini 2.5 Flash. Ask any question or reference your uploaded documents."
    )
    db.add(greeting)
    db.commit()
    db.refresh(conv)

    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        messages=[
            MessageResponse(
                id=greeting.id,
                role=greeting.role,
                content=greeting.content,
                citations=[],
                timestamp=greeting.created_at.strftime("%I:%M %p"),
                model=greeting.model
            )
        ],
        documentIds=[],
        createdAt=format_iso_utc(conv.created_at),
        updatedAt=format_iso_utc(conv.updated_at),
        running_summary=None,
    )

@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()

    msg_responses = []
    for m in msgs:
        cits = db.query(Citation).filter(Citation.message_id == m.id).all()
        cit_responses = [CitationResponse.model_validate(c) for c in cits]

        msg_responses.append(
            MessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                citations=cit_responses,
                timestamp=m.created_at.strftime("%I:%M %p"),
                model=m.model
            )
        )

    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        messages=msg_responses,
        documentIds=conv.document_ids or [],
        createdAt=format_iso_utc(conv.created_at),
        updatedAt=format_iso_utc(conv.updated_at),
        running_summary=getattr(conv, 'running_summary', None),
    )

@router.get("/{conversation_id}/export")
def export_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify ownership
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Fetch ordered messages
    msgs = db.query(Message).filter(
        Message.conversation_id == conv.id
    ).order_by(Message.created_at.asc()).all()

    # Fetch citations mapped per message
    citations_map = {}
    for m in msgs:
        cits = db.query(Citation).filter(Citation.message_id == m.id).all()
        citations_map[m.id] = cits

    try:
        pdf_bytes = generate_conversation_pdf(
            conversation=conv,
            messages=msgs,
            citations_map=citations_map,
        )
    except Exception as err:
        logger.error(f"Failed to generate conversation PDF: {err}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate conversation PDF export.")

    filename = f"{slugify(conv.title)}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        }
    )

@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted successfully"}

@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def post_message(
    conversation_id: str,
    req: CreateMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 1. Fetch recent messages BEFORE adding new user message (last 8 messages = ~4 conversational turns)
    recent_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .limit(8)
        .all()
    )
    recent_messages.reverse()  # chronological order for prompt & rewrite

    # 2. Manage context window size for long conversations (> 8 messages)
    total_messages_count = db.query(Message).filter(Message.conversation_id == conv.id).count()
    if total_messages_count > 8 and (total_messages_count % 10 == 0 or not conv.running_summary):
        try:
            all_prior_msgs = (
                db.query(Message)
                .filter(Message.conversation_id == conv.id)
                .order_by(Message.created_at.asc())
                .all()
            )
            # Summarize turns before the sliding window (all messages except the last 8)
            msgs_to_summarize = all_prior_msgs[:-8] if len(all_prior_msgs) > 8 else all_prior_msgs
            if msgs_to_summarize:
                new_summary = await asyncio.to_thread(
                    generate_conversation_summary, msgs_to_summarize, conv.running_summary
                )
                if new_summary:
                    conv.running_summary = new_summary
                    db.flush()
        except Exception as sum_err:
            logger.warning(f"Failed to generate running summary: {sum_err}")

    # 3. Add and persist user message
    user_content = req.get_content()
    user_msg_id = str(uuid.uuid4())
    user_msg = Message(
        id=user_msg_id,
        conversation_id=conv.id,
        role="user",
        content=user_content
    )
    db.add(user_msg)
    db.flush()

    if conv.title == "New Research Session" or conv.title == "New Conversation":
        conv.title = user_content[:40] + "..." if len(user_content) > 40 else user_content

    # 4. Generate RAG response with conversation history & running summary
    effective_context_doc_ids = (
        req.context_document_ids
        if req.context_document_ids is not None
        else (conv.document_ids or None)
    )

    try:
        answer_text, citations_list, rag_metadata = await asyncio.to_thread(
            generate_rag_response,
            db,
            current_user.id,
            conv.id,
            user_content,
            effective_context_doc_ids,
            recent_messages,
            getattr(conv, 'running_summary', None),
        )
    except Exception as ge:
        logger.error(f"Error generating RAG response: {ge}")
        answer_text = "I encountered an issue generating a response for your document query. Please check your uploaded files or refine your search prompt."
        citations_list = []
        rag_metadata = {"provider": "error", "degraded": True}

    if req.context_document_ids is not None:
        conv.document_ids = req.context_document_ids

    # Map provider name to a display-friendly model name
    _provider_display = {
        "gemini": "Gemini 2.5 Flash",
        "fallback": "Fallback (Raw Chunks)",
    }
    provider_name = rag_metadata.get("provider", "gemini")
    model_display = _provider_display.get(provider_name, provider_name)

    ai_msg_id = str(uuid.uuid4())
    ai_msg = Message(
        id=ai_msg_id,
        conversation_id=conv.id,
        role="assistant",
        content=answer_text
    )
    db.add(ai_msg)
    db.flush()

    citation_responses = []
    for c in citations_list:
        try:
            cit_id = str(uuid.uuid4())
            cit_obj = Citation(
                id=cit_id,
                message_id=ai_msg.id,
                document_id=c.get("document_id", ""),
                document_title=c.get("document_title", "Document"),
                excerpt=c.get("excerpt", ""),
                page=c.get("page"),
                chunk=c.get("chunk"),
                score=c.get("score"),
                url=f"/api/v1/documents/{c.get('document_id', '')}/file" if c.get("document_id") else None
            )
            db.add(cit_obj)
            db.flush()
            citation_responses.append(CitationResponse.model_validate(cit_obj))
        except Exception as ce:
            logger.warning(f"Skipping malformed citation: {ce}")

    conv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ai_msg)

    return MessageResponse(
        id=ai_msg.id,
        role=ai_msg.role,
        content=ai_msg.content,
        citations=citation_responses,
        timestamp=ai_msg.created_at.strftime("%I:%M %p"),
        model=model_display,
        provider=provider_name,
        degraded=rag_metadata.get("degraded", False),
        speech_text=rag_metadata.get("speech_text", ai_msg.content),
    )

