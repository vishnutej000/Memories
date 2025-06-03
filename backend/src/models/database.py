"""
Database models and connection management for WhatsApp Memory Vault
"""
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.sqlite import JSON
from datetime import datetime
from typing import Optional, Generator
import os
from pathlib import Path

# Create storage directory
STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(exist_ok=True)

# Database configuration
DATABASE_URL = f"sqlite:///{STORAGE_DIR}/whatsapp_vault.db"

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=False  # Set to True for SQL debugging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

class Chat(Base):
    """Chat model for storing WhatsApp chat metadata"""
    __tablename__ = "chats"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    is_group_chat = Column(Boolean, default=False)
    participants = Column(JSON)  # Store as JSON array
    message_count = Column(Integer, default=0)
    first_message_date = Column(String)
    last_message_date = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Additional metadata
    file_size = Column(Integer)
    processing_status = Column(String, default="completed")
    error_message = Column(Text, nullable=True)

class Message(Base):
    """Message model for storing individual chat messages"""
    __tablename__ = "messages"
    
    id = Column(String, primary_key=True, index=True)
    chat_id = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    sender = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(String, default="text")
    
    # Analysis fields
    sentiment_score = Column(Float, nullable=True)
    sentiment_label = Column(String, nullable=True)
    word_count = Column(Integer, default=0)
    
    # Metadata
    is_media = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class JournalEntry(Base):
    """Journal entry model for user diary entries"""
    __tablename__ = "journal_entries"
    
    id = Column(String, primary_key=True, index=True)
    chat_id = Column(String, nullable=False, index=True)
    date = Column(String, nullable=False, index=True)  # YYYY-MM-DD format
    text = Column(Text, nullable=False)
    emotion = Column(JSON)  # Store emotion object as JSON
    tags = Column(JSON)  # Store tags array as JSON
    audio_note_url = Column(String, nullable=True)
    audio_duration = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AudioRecording(Base):
    """Audio recording model for voice notes"""
    __tablename__ = "audio_recordings"
    
    id = Column(String, primary_key=True, index=True)
    chat_id = Column(String, nullable=True, index=True)
    journal_entry_id = Column(String, nullable=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    duration = Column(Integer, default=0)  # Duration in seconds
    file_size = Column(Integer, default=0)  # Size in bytes
    transcription = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# Database dependency
def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database initialization
def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def get_db_session() -> Session:
    """Get a database session (for non-dependency usage)"""
    return SessionLocal()

# Initialize database on import
create_tables()
