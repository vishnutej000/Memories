from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union
from datetime import datetime
from enum import Enum

# Enums
class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    FILE = "file"
    CONTACT = "contact"
    LOCATION = "location"
    STICKER = "sticker"
    SYSTEM = "system"

class SentimentLabel(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"

# Message Models
class Message(BaseModel):
    id: str
    timestamp: datetime
    sender: str
    content: str
    type: MessageType = MessageType.TEXT
    
    class Config:
        schema_extra = {
            "example": {
                "id": "msg_1234",
                "timestamp": "2023-05-18T08:39:07Z",
                "sender": "John Doe",
                "content": "Hello, how are you?",
                "type": "text"
            }
        }

class MessageList(BaseModel):
    messages: List[Message]
    count: int
    total: Optional[int] = None
    page: Optional[int] = None
    pages: Optional[int] = None

# Analysis Models
class SentimentScore(BaseModel):
    score: float
    label: SentimentLabel

class DailySentiment(BaseModel):
    date: str
    sentiment: SentimentScore
    message_count: int

class SentimentAnalysis(BaseModel):
    overall: SentimentScore
    daily: List[DailySentiment]

class KeywordItem(BaseModel):
    word: str
    count: int
    sentiment: Optional[float] = None

class KeywordAnalysis(BaseModel):
    keywords: List[KeywordItem]
    total_words: int

class MessageCountByUser(BaseModel):
    user: str
    count: int
    percentage: float

class MessageCountByDay(BaseModel):
    day: str
    count: int

class MessageCountByHour(BaseModel):
    hour: int
    count: int

class ChatStatistics(BaseModel):
    total_messages: int
    date_range: Dict[str, str]
    message_count_by_user: List[MessageCountByUser]
    message_count_by_day: List[MessageCountByDay]
    message_count_by_hour: List[MessageCountByHour]
    average_messages_per_day: float
    busiest_day: str
    quietest_day: str
    busiest_hour: int

# Export Models
class ExportOptions(BaseModel):
    include_media: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

# Error Models
class ErrorResponse(BaseModel):
    message: str
    details: Optional[str] = None