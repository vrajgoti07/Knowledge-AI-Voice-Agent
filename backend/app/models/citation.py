import uuid
from sqlalchemy import Column, String, Integer, Text, Float, ForeignKey
from app.db.session import Base

class Citation(Base):
    __tablename__ = "citations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(String, nullable=False)
    document_title = Column(String, nullable=False)
    excerpt = Column(Text, nullable=False)
    page = Column(Integer, nullable=True)
    chunk = Column(Integer, nullable=True)
    score = Column(Float, nullable=True)
    url = Column(String, nullable=True)
