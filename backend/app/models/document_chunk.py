import uuid
from sqlalchemy import Column, String, Integer, Text, ForeignKey
from app.db.session import Base

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    page_start = Column(Integer, nullable=True)
    page_end = Column(Integer, nullable=True)
    tokens = Column(Integer, default=0)
    section_number = Column(String, nullable=True)
    section_title = Column(String, nullable=True)
    parent_section = Column(String, nullable=True)
    parent_id = Column(String, nullable=True)
    parent_content = Column(Text, nullable=True)
