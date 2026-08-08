import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
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
                    pinned=conv.pinned or False
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
        updatedAt=format_iso_utc(conv.updated_at)
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
        updatedAt=format_iso_utc(conv.updated_at)
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
def post_message(
    conversation_id: str,
    req: CreateMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

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

    try:
        answer_text, citations_list, rag_metadata = generate_rag_response(
            db=db,
            user_id=current_user.id,
            conversation_id=conv.id,
            user_query=user_content,
            context_document_ids=req.context_document_ids
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
                score=c.get("score")
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

