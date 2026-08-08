from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.message import Message
from app.core.deps import get_current_user

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns real dashboard statistics for the authenticated user."""

    # Total documents (only user's personal uploaded documents)
    total_documents = db.query(func.count(Document.id)).filter(
        Document.uploaded_by == current_user.id
    ).scalar() or 0

    # Active conversations (user's own)
    active_conversations = db.query(func.count(Conversation.id)).filter(
        Conversation.user_id == current_user.id
    ).scalar() or 0

    # Storage used (sum of file_size in bytes, converted to MB)
    storage_bytes = db.query(func.sum(Document.file_size)).filter(
        Document.uploaded_by == current_user.id
    ).scalar() or 0
    storage_used_mb = round(storage_bytes / (1024 * 1024), 2)

    # Queries this week — count user-role messages in last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    # Get conversation IDs for this user
    user_conv_ids = [
        r[0] for r in db.query(Conversation.id).filter(
            Conversation.user_id == current_user.id
        ).all()
    ]

    queries_this_week = 0
    if user_conv_ids:
        queries_this_week = db.query(func.count(Message.id)).filter(
            Message.conversation_id.in_(user_conv_ids),
            Message.role == "user",
            Message.created_at >= seven_days_ago
        ).scalar() or 0

    # Queries per day for the last 7 days (for chart)
    daily_queries = []
    for i in range(6, -1, -1):
        day_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        count = 0
        if user_conv_ids:
            count = db.query(func.count(Message.id)).filter(
                Message.conversation_id.in_(user_conv_ids),
                Message.role == "user",
                Message.created_at >= day_start,
                Message.created_at < day_end
            ).scalar() or 0
        daily_queries.append({
            "date": day_start.strftime("%a"),
            "queries": count
        })

    return {
        "totalDocuments": total_documents,
        "activeConversations": active_conversations,
        "storageUsedMb": storage_used_mb,
        "queriesThisWeek": queries_this_week,
        "dailyQueries": daily_queries
    }
