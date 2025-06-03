from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form # type: ignore
from typing import List, Optional, Dict, Any
from pydantic import BaseModel # type: ignore
from datetime import datetime
import tempfile
import os
import logging
import re
import uuid
from sqlalchemy.orm import Session # type: ignore
from sqlalchemy import desc, func # type: ignore

# Import the functions we created
from src.core.analysis.statistics import calculate_chat_statistics, extract_keywords
from src.core.parsing.adapter import parse_whatsapp_chat
from src.models.database import get_db, Chat as ChatModel, Message as MessageModel, create_tables
from src.utils.auth import get_current_user_optional
from src.utils.security import sanitize_input, validate_file_upload

logger = logging.getLogger(__name__)

# Ensure tables are created
create_tables()

router = APIRouter(
    prefix="/chats",
    tags=["chats"],
    responses={404: {"description": "Not found"}},
)

# Pydantic models for API
class MessageCreate(BaseModel):
    content: str
    sender: str
    timestamp: datetime
    message_type: str = "text"
    
class ChatCreate(BaseModel):
    title: str
    participants: List[str]
    is_group_chat: bool = False
    filename: str

class MessageResponse(BaseModel):
    id: str
    content: str
    sender: str
    timestamp: datetime
    message_type: str
    sentiment_score: Optional[float] = None
    
class ChatResponse(BaseModel):
    id: str
    title: str
    participants: List[str]
    is_group_chat: bool
    filename: str
    message_count: int
    first_message_date: Optional[str]
    last_message_date: Optional[str]
    created_at: datetime
    updated_at: datetime

@router.get("/", response_model=List[ChatResponse])
async def get_chats(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Get all chats with pagination
    """
    try:
        chats = db.query(ChatModel).offset(skip).limit(limit).all()
        
        chat_responses = []
        for chat in chats:
            chat_responses.append(ChatResponse(
                id=chat.id,
                title=chat.title,
                participants=chat.participants or [],
                is_group_chat=chat.is_group_chat,
                filename=chat.filename,
                message_count=chat.message_count,
                first_message_date=chat.first_message_date,
                last_message_date=chat.last_message_date,
                created_at=chat.created_at,
                updated_at=chat.updated_at
            ))
        
        return chat_responses
    except Exception as e:
        logger.error(f"Error getting chats: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: str, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Get a specific chat by ID
    """
    try:
        # Sanitize input
        chat_id = sanitize_input(chat_id)
        
        chat = db.query(ChatModel).filter(ChatModel.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
            
        return ChatResponse(
            id=chat.id,
            title=chat.title,
            participants=chat.participants or [],
            is_group_chat=chat.is_group_chat,
            filename=chat.filename,
            message_count=chat.message_count,
            first_message_date=chat.first_message_date,
            last_message_date=chat.last_message_date,
            created_at=chat.created_at,
            updated_at=chat.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat {chat_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/", response_model=ChatResponse)
async def create_chat(
    chat: ChatCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Create a new chat
    """
    try:
        # Sanitize inputs
        title = sanitize_input(chat.title)
        filename = sanitize_input(chat.filename)
        participants = [sanitize_input(p) for p in chat.participants]
        
        # Create new chat
        chat_id = str(uuid.uuid4())
        db_chat = ChatModel(
            id=chat_id,
            title=title,
            filename=filename,
            is_group_chat=chat.is_group_chat,
            participants=participants,
            message_count=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_chat)
        db.commit()
        db.refresh(db_chat)
        
        return ChatResponse(
            id=db_chat.id,
            title=db_chat.title,
            participants=db_chat.participants or [],
            is_group_chat=db_chat.is_group_chat,
            filename=db_chat.filename,
            message_count=db_chat.message_count,
            first_message_date=db_chat.first_message_date,
            last_message_date=db_chat.last_message_date,
            created_at=db_chat.created_at,
            updated_at=db_chat.updated_at
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating chat: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{chat_id}/messages", response_model=List[MessageResponse])
async def get_chat_messages(
    chat_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Get messages for a specific chat
    """
    try:
        # Sanitize input
        chat_id = sanitize_input(chat_id)
        
        # Check if chat exists
        chat = db.query(ChatModel).filter(ChatModel.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
            
        # Get messages
        messages = db.query(MessageModel).filter(
            MessageModel.chat_id == chat_id
        ).order_by(MessageModel.timestamp).offset(skip).limit(limit).all()
        
        message_responses = []
        for msg in messages:
            message_responses.append(MessageResponse(
                id=msg.id,
                content=msg.content,
                sender=msg.sender,
                timestamp=msg.timestamp,
                message_type=msg.message_type,
                sentiment_score=msg.sentiment_score
            ))
        
        return message_responses
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting messages for chat {chat_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{chat_id}/statistics")
async def get_chat_statistics(
    chat_id: str, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Get statistics for a specific chat
    """
    try:
        # Sanitize input
        chat_id = sanitize_input(chat_id)
        
        # Check if chat exists
        chat = db.query(ChatModel).filter(ChatModel.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
            
        # Get messages for statistics
        messages = db.query(MessageModel).filter(MessageModel.chat_id == chat_id).all()
        
        if not messages:
            return {
                "total_messages": 0,
                "message_count_by_user": [],
                "message_count_by_day": [],
                "message_count_by_hour": [],
                "date_range": {"start": None, "end": None}
            }
        
        # Convert to format expected by statistics function
        message_objects = []
        for msg in messages:
            message_objects.append(type('Message', (), {
                'sender': msg.sender,
                'timestamp': msg.timestamp,
                'content': msg.content
            })())
        
        stats = calculate_chat_statistics(message_objects)
        return stats.dict() if hasattr(stats, 'dict') else stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting statistics for chat {chat_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{chat_id}/keywords")
async def get_chat_keywords(
    chat_id: str, 
    top_n: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Get keywords from a specific chat
    """
    try:
        # Sanitize input
        chat_id = sanitize_input(chat_id)
        
        # Check if chat exists
        chat = db.query(ChatModel).filter(ChatModel.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
            
        # Get messages for keyword analysis
        messages = db.query(MessageModel).filter(MessageModel.chat_id == chat_id).all()
        
        if not messages:
            return {"keywords": [], "count": 0}
        
        # Convert to format expected by extract_keywords function
        message_objects = []
        for msg in messages:
            message_objects.append(type('Message', (), {
                'content': msg.content
            })())
        
        keywords = extract_keywords(message_objects, limit=top_n)
        return {
            "keywords": keywords.keywords if hasattr(keywords, 'keywords') else keywords,
            "count": len(keywords.keywords) if hasattr(keywords, 'keywords') else len(keywords)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting keywords for chat {chat_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/import")
async def import_chat(
    file: UploadFile = File(...), 
    user_name: str = Form(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Import a WhatsApp chat export file (.txt) and parse it
    """    # Validate file
    validate_file_upload(file.filename, file.content_type, max_size_mb=50)
    
    # Sanitize inputs
    user_name = sanitize_input(user_name)
    
    temp_file_path = None
    try:
        # Create a temporary file to save the uploaded content
        with tempfile.NamedTemporaryFile(mode='w+b', suffix='.txt', delete=False) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Parse the WhatsApp chat using our adapter
        logger.info(f"Parsing WhatsApp chat file: {file.filename}")
        messages = parse_whatsapp_chat(temp_file_path, user_name)
        
        if not messages:
            raise HTTPException(status_code=400, detail="No valid messages found in the file")
        
        # Create chat record
        chat_id = str(uuid.uuid4())
        participants = list(set(msg.sender for msg in messages))
        
        # Determine chat title from filename or participants
        chat_title = file.filename.replace('.txt', '') if file.filename else f"Chat with {', '.join(participants[:3])}"
        if len(participants) > 3:
            chat_title += f" and {len(participants) - 3} others"
        
        db_chat = ChatModel(
            id=chat_id,
            title=sanitize_input(chat_title),
            filename=file.filename or "unknown.txt",
            is_group_chat=len(participants) > 2,
            participants=participants,
            message_count=len(messages),
            first_message_date=min(msg.timestamp for msg in messages).isoformat(),
            last_message_date=max(msg.timestamp for msg in messages).isoformat(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_chat)
        db.flush()  # Get the chat ID
        
        # Save messages to database
        db_messages = []
        for msg in messages:
            db_message = MessageModel(
                id=msg.id,
                chat_id=chat_id,
                content=sanitize_input(msg.content),
                sender=sanitize_input(msg.sender),
                timestamp=msg.timestamp,
                message_type=msg.type.value if hasattr(msg.type, 'value') else str(msg.type)
            )
            db_messages.append(db_message)
        
        db.add_all(db_messages)
        db.commit()
        
        # Clean up the temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        
        # Return the parsed data
        return {
            "success": True,
            "chat_id": chat_id,
            "filename": file.filename,
            "count": len(messages),
            "participants": participants,
            "date_range": {
                "start": min(msg.timestamp for msg in messages).isoformat(),
                "end": max(msg.timestamp for msg in messages).isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up temp file in case of error
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        
        db.rollback()
        logger.error(f"Error parsing WhatsApp chat: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error parsing chat file: {str(e)}"
        )

@router.get("/search", response_model=Dict[str, Any])
async def search_messages(
    q: str = Query(..., min_length=1),
    chat_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Search messages across all chats or within a specific chat
    """
    try:
        # Sanitize inputs
        search_query = sanitize_input(q)
        
        # Build query
        query = db.query(MessageModel).filter(
            MessageModel.content.contains(search_query)
        )
        
        # Filter by chat if specified
        if chat_id:
            chat_id = sanitize_input(chat_id)
            query = query.filter(MessageModel.chat_id == chat_id)
        
        # Get total count
        total_count = query.count()
        
        # Get paginated results
        messages = query.order_by(desc(MessageModel.timestamp)).offset(skip).limit(limit).all()
        
        message_responses = []
        for msg in messages:
            message_responses.append({
                "id": msg.id,
                "content": msg.content,
                "sender": msg.sender,
                "timestamp": msg.timestamp.isoformat(),
                "message_type": msg.message_type,
                "chat_id": msg.chat_id
            })
        
        return {
            "query": search_query,
            "total_count": total_count,
            "count": len(message_responses),
            "messages": message_responses,
            "pagination": {
                "skip": skip,
                "limit": limit,
                "has_more": total_count > skip + limit
            }
        }
    except Exception as e:
        logger.error(f"Error searching messages: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
async def detect_participants(file: UploadFile = File(...)):
    """
    Detect participants from a WhatsApp chat export file without full parsing
    """
    # Validate file type
    if not file.filename or not file.filename.endswith('.txt'):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Only .txt files are supported."
        )
    
    try:
        # Read file content directly
        content = await file.read()
        text = content.decode('utf-8')
        
        # Use the same regex patterns as in the adapter to detect participants
        participants = set()
          # Multiple regex patterns for different WhatsApp formats
        patterns = [
            # Pattern 1: [DD/MM/YYYY, HH:MM:SS] Participant: Message
            r'^\[(\d{1,2}/\d{1,2}/\d{4}, \d{1,2}:\d{2}:\d{2})\] ([^:]+): (.+)$',
            # Pattern 2: DD/MM/YY, HH:MM AM/PM - Participant: Message
            r'^(\d{1,2}/\d{1,2}/\d{2,4}, \d{1,2}:\d{2} (?:AM|PM|am|pm)) - ([^:]+): (.+)$',
            # Pattern 3: DD/MM/YYYY, HH:MM - Participant: Message  
            r'^(\d{1,2}/\d{1,2}/\d{4}, \d{1,2}:\d{2}) - ([^:]+): (.+)$',
            # Pattern 4: MM/DD/YY, HH:MM - Participant: Message
            r'^(\d{1,2}/\d{1,2}/\d{2,4}, \d{1,2}:\d{2}) - ([^:]+): (.+)$',
            # Pattern 5: [DD/MM/YY HH:MM:SS] Participant: Message
            r'^\[(\d{1,2}/\d{1,2}/\d{2} \d{1,2}:\d{2}:\d{2})\] ([^:]+): (.+)$'
        ]
        
        logger.info(f"Detecting participants in file: {file.filename}")          # Define system message patterns to exclude
        system_message_patterns = [
            r"Messages and calls are end-to-end encrypted",
            r"You created group",
            r"created this group",
            r"added you",
            r"removed",
            r"left",
            r"joined using this group's invite link",
            r"Security code changed",
            r"This business account is verified by WhatsApp",
            r"changed their phone number",
            r"changed the group description",
            r"changed the subject to",
            r"changed this group's icon",
            r"deleted this group's icon",
            r"Your security code with .* changed",
            r"Missed voice call",
            r"Missed video call",
            r"Call ended",
            r"Waiting for this message",
            # Additional comprehensive patterns
            r".+ added .+ to the group",
            r".+ removed .+ from the group",
            r".+ left the group",
            r".+ joined the group",
            r".+ changed .+ group name",
            r".+ changed .+ group photo",
            r".+ deleted .+ group photo",
            r".+ made .+ an admin",
            r".+ is no longer an admin",
            r"Group invite link reset",
            r"Only admins can edit group info",
            r"Only admins can send messages",
            r"All participants can now send messages",
            r"Messages to this group are now secured",
            r"<Media omitted>",
            r"This message was deleted",
            r"You're now an admin",
            r"You're no longer an admin",
            r".+ added .+",
            r".+ removed .+",
            r"Disappearing messages",
            r"Auto-delete",
            r"Business account",
            r"Verified by WhatsApp",
            r"\+\d{1,3} \d{1,4} \d{3,4} \d{4}",  # Phone numbers            r"^\d{1,2}\/\d{1,2}\/\d{2,4}",  # Lines that start with just dates
            r"^[A-Z]{3} \d{1,2}, \d{4}",  # Month abbreviations like "JAN 15, 2024"
        ]
        
        def is_system_message(content: str) -> bool:
            """Check if a message is a system message that should be excluded"""
            for pattern in system_message_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    return True
            return False
        
        def is_system_sender(sender: str) -> bool:
            """Check if a sender name appears to be a system message"""
            # Common system sender patterns
            system_senders = [
                'whatsapp', 'system', 'notification', 'admin', 
                'security', 'business', 'verified', 'group',
                'auto-delete', 'disappearing'
            ]
            sender_lower = sender.lower().strip()
            
            # Check for exact matches or if sender contains system keywords
            if sender_lower in system_senders:
                return True
            
            # Check for phone number patterns (system messages sometimes appear with phone numbers)
            if re.match(r'^\+?\d{10,15}$', sender.strip()):
                return True
                
            # Check for very short names (likely system)
            if len(sender.strip()) <= 2:
                return True
                
            # Check for names that are just dates or numbers
            if re.match(r'^\d{1,2}\/\d{1,2}\/\d{2,4}$', sender.strip()):
                return True
                
            return False
        
        for line in text.split('\n'):
            line = line.strip()
            if not line:
                continue
            
            logger.debug(f"Processing line: {line[:50]}...")
            
            # Skip lines that are clearly system messages without participants
            # Pattern: DD/MM/YY, HH:MM am/pm - System message (no participant name)
            if re.match(r'^\d{1,2}/\d{1,2}/\d{2,4}, \d{1,2}:\d{2} (?:AM|PM|am|pm) - [^:]*$', line):
                logger.debug(f"Skipping system message line (no participant): {line[:50]}...")
                continue
                
            for i, pattern in enumerate(patterns):
                match = re.match(pattern, line, re.MULTILINE)
                if match:
                    logger.debug(f"Pattern {i+1} matched! Groups: {match.groups()}")
                    participant = match.group(2).strip()
                    message_content = match.group(3).strip()
                      # Skip system messages
                    if is_system_message(message_content):
                        logger.debug(f"Skipping system message: {message_content[:50]}...")
                        continue
                    
                    # Skip system senders
                    if is_system_sender(participant):
                        logger.debug(f"Skipping system sender: {participant}")
                        continue
                    
                    if participant and len(participant) > 0:
                        participants.add(participant)
                        logger.debug(f"Found participant '{participant}' using pattern {i+1}")
                    break
            else:
                logger.debug(f"No pattern matched for line: {line[:50]}...")
        
        participant_list = list(participants)
        logger.info(f"Detected {len(participant_list)} participants: {participant_list}")
        
        return {
            "participants": participant_list,
            "count": len(participant_list)
        }
        
    except Exception as e:
        logger.error(f"Error detecting participants: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error detecting participants: {str(e)}"
        )