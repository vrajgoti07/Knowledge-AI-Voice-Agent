import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar = Column(String, nullable=True)
    role = Column(String, default="user") # 'user' | 'admin' | 'moderator'
    plan = Column(String, default="pro") # 'free' | 'pro' | 'enterprise'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
