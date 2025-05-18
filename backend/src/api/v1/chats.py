from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from typing import List, Optional
import logging
from pathlib import Path
import tempfile

from src.models.schemas import (
    MessageList, 
    Message, 
    ChatStatistics, 
    SentimentAnalysis,
    KeywordAnalysis,
    ErrorResponse
)
from src.core.parsing.adapter import parse_whatsapp_chat
from src.core.analysis.sentiment import analyze_chat_sentiment
from src.core.analysis.statistics import calculate_chat_statistics, extract_keywords
from src.storage.local import save_messages, get_messages

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/chats/import", response_model=MessageList)
async def import_chat(
    file: UploadFile = File(...),
    user_name: str = Form(...),
):
    """
    Import a WhatsApp chat export file and parse it.
    
    Args:
        file: The WhatsApp chat export file (*.txt)
        user_name: The name of the current user in the chat
    
    Returns:
        MessageList: The parsed messages
    """
    logger.info(f"Importing chat file: {file.filename}")
    
    if not file.filename or not file.filename.endswith('.txt'):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file format. Only WhatsApp .txt exports are supported."
        )
    
    try:
        # Save uploaded file to a temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.txt') as temp_file:
            temp_path = Path(temp_file.name)
            content = await file.read()
            temp_file.write(content)
        
        # Parse the chat file
        messages = parse_whatsapp_chat(str(temp_path), user_name)
        
        # Save messages to storage
        save_messages(messages)
        
        # Delete the temporary file
        temp_path.unlink()
        
        return MessageList(messages=messages, count=len(messages))
    
    except Exception as e:
        logger.error(f"Error parsing chat file: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse chat file: {str(e)}"
        )

@router.get("/chats/messages", response_model=MessageList)
async def get_chat_messages(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
):
    """
    Get paginated chat messages.
    
    Args:
        page: Page number (starting from 1)
        limit: Number of messages per page
    
    Returns:
        MessageList: The messages for the requested page
    """
    try:
        all_messages = get_messages()
        
        # Calculate pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        
        # Get messages for the current page
        paged_messages = all_messages[start_idx:end_idx]
        
        return MessageList(
            messages=paged_messages,
            count=len(paged_messages),
            total=len(all_messages),
            page=page,
            pages=(len(all_messages) + limit - 1) // limit  # Ceiling division
        )
    
    except Exception as e:
        logger.error(f"Error retrieving messages: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve messages: {str(e)}"
        )

@router.get("/chats/search", response_model=MessageList)
async def search_messages(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Search messages by content.
    
    Args:
        q: Search query
        page: Page number
        limit: Number of results per page
    
    Returns:
        MessageList: Messages matching the search query
    """
    try:
        all_messages = get_messages()
        
        # Filter messages by search query (case-insensitive)
        matches = [msg for msg in all_messages if q.lower() in msg.content.lower()]
        
        # Calculate pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        
        # Get messages for the current page
        paged_matches = matches[start_idx:end_idx]
        
        return MessageList(
            messages=paged_matches,
            count=len(paged_matches),
            total=len(matches),
            page=page,
            pages=(len(matches) + limit - 1) // limit
        )
    
    except Exception as e:
        logger.error(f"Error searching messages: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search messages: {str(e)}"
        )

@router.get("/chats/statistics", response_model=ChatStatistics)
async def get_statistics():
    """
    Get statistical analysis of the chat.
    
    Returns:
        ChatStatistics: Statistical data about the chat
    """
    try:
        messages = get_messages()
        
        if not messages:
            raise HTTPException(
                status_code=404,
                detail="No chat data found. Please import a chat first."
            )
        
        stats = calculate_chat_statistics(messages)
        return stats
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating statistics: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate statistics: {str(e)}"
        )

@router.get("/chats/sentiment/daily", response_model=SentimentAnalysis)
async def get_sentiment_analysis():
    """
    Get sentiment analysis of the chat by day.
    
    Returns:
        SentimentAnalysis: Sentiment data by day
    """
    try:
        messages = get_messages()
        
        if not messages:
            raise HTTPException(
                status_code=404,
                detail="No chat data found. Please import a chat first."
            )
        
        sentiment = analyze_chat_sentiment(messages)
        return sentiment
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze sentiment: {str(e)}"
        )

@router.get("/chats/keywords", response_model=KeywordAnalysis)
async def get_keywords(limit: int = Query(20, ge=5, le=100)):
    """
    Get top keywords from the chat.
    
    Args:
        limit: Number of top keywords to return
    
    Returns:
        KeywordAnalysis: Top keywords and their frequencies
    """
    try:
        messages = get_messages()
        
        if not messages:
            raise HTTPException(
                status_code=404,
                detail="No chat data found. Please import a chat first."
            )
        
        keywords = extract_keywords(messages, limit)
        return keywords
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting keywords: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract keywords: {str(e)}"
        )