from fastapi import APIRouter, Depends, HTTPException, Query # type: ignore
from typing import List, Optional, Dict, Any
from pydantic import BaseModel # type: ignore
from datetime import datetime

# Import the functions we created
from src.core.analysis.statistics import calculate_chat_statistics, extract_keywords

router = APIRouter(
    prefix="/chats",
    tags=["chats"],
    responses={404: {"description": "Not found"}},
)

# Models
class Message(BaseModel):
    id: str
    content: str
    sender: str
    timestamp: datetime
    
class Chat(BaseModel):
    id: str
    title: str
    participants: List[str]
    created_at: datetime
    updated_at: datetime
    messages: List[Message] = []

# Sample data (in a real app, this would come from a database)
sample_chats = [
    {
        "id": "1",
        "title": "Family Chat",
        "participants": ["Mom", "Dad", "Me"],
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-05-18T10:00:00Z",
        "messages": [
            {"id": "m1", "content": "Hi everyone!", "sender": "Me", "timestamp": "2025-05-18T10:00:00Z"},
            {"id": "m2", "content": "Hello dear", "sender": "Mom", "timestamp": "2025-05-18T10:01:00Z"}
        ]
    }
]

@router.get("/")
async def get_chats():
    """
    Get all chats
    """
    return sample_chats

@router.get("/{chat_id}")
async def get_chat(chat_id: str):
    """
    Get a specific chat by ID
    """
    for chat in sample_chats:
        if chat["id"] == chat_id:
            return chat
    raise HTTPException(status_code=404, detail="Chat not found")

@router.post("/")
async def create_chat(chat: Chat):
    """
    Create a new chat
    """
    # In a real app, you would save to a database
    new_chat = chat.dict()
    sample_chats.append(new_chat)
    return new_chat

@router.get("/{chat_id}/statistics")
async def get_chat_statistics(chat_id: str):
    """
    Get statistics for a specific chat
    """
    for chat in sample_chats:
        if chat["id"] == chat_id:
            stats = calculate_chat_statistics(chat["messages"])
            return stats
    raise HTTPException(status_code=404, detail="Chat not found")

@router.get("/{chat_id}/keywords")
async def get_chat_keywords(chat_id: str, top_n: int = Query(10, ge=1, le=100)):
    """
    Get keywords from a specific chat
    """
    for chat in sample_chats:
        if chat["id"] == chat_id:
            # Combine all message content
            all_text = " ".join([msg["content"] for msg in chat["messages"]])
            keywords = extract_keywords(all_text, top_n=top_n)
            return {"keywords": keywords, "count": len(keywords)}
    raise HTTPException(status_code=404, detail="Chat not found")