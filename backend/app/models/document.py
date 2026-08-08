import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, JSON
from app.db.session import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    file_type = Column(String, default="pdf") # pdf|docx|txt|md|csv|xlsx|pptx|url|image
    file_size = Column(Integer, default=0)
    status = Column(String, default="uploading") # uploading|processing|ready|error|archived
    tags = Column(JSON, default=list)
    category = Column(String, nullable=True)
    uploaded_by = Column(String, nullable=False) # user_id
    chunks = Column(Integer, default=0)
    tokens = Column(Integer, default=0)
    thumbnail_url = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    is_knowledge_base = Column(Boolean, default=False)
    checksum = Column(String, nullable=True, index=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
