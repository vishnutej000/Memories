from typing import List, Dict, Any
from collections import Counter, defaultdict
from datetime import datetime
import logging
import re
import nltk # type: ignore
from nltk.tokenize import word_tokenize # type: ignore
from nltk.corpus import stopwords # type: ignore

from src.models.schemas import (
    Message, 
    ChatStatistics, 
    MessageCountByUser, 
    MessageCountByDay,
    MessageCountByHour,
    KeywordAnalysis,
    KeywordItem
)

logger = logging.getLogger(__name__)

# Initialize NLTK resources
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

# Get stopwords
STOP_WORDS = set(stopwords.words('english'))

def calculate_chat_statistics(messages: List[Message]) -> ChatStatistics:
    """
    Calculate statistics for the chat.
    
    Args:
        messages: List of messages to analyze
    
    Returns:
        ChatStatistics: Statistical data about the chat
    """
    if not messages:
        return ChatStatistics(
            total_messages=0,
            date_range={"start": "", "end": ""},
            message_count_by_user=[],
            message_count_by_day=[],
            message_count_by_hour=[],
            average_messages_per_day=0,
            busiest_day="",
            quietest_day="",
            busiest_hour=0
        )
    
    # Sort messages by timestamp
    sorted_messages = sorted(messages, key=lambda m: m.timestamp)
    first_date = sorted_messages[0].timestamp.strftime("%Y-%m-%d")
    last_date = sorted_messages[-1].timestamp.strftime("%Y-%m-%d")
    
    # Count messages by user
    user_counter = Counter([message.sender for message in messages])
    total_messages = len(messages)
    
    message_count_by_user = [
        MessageCountByUser(
            user=user,
            count=count,
            percentage=(count / total_messages) * 100
        )
        for user, count in user_counter.most_common()
    ]
    
    # Count messages by day of the week
    day_counter = Counter([message.timestamp.strftime("%A") for message in messages])
    message_count_by_day = [
        MessageCountByDay(
            day=day,
            count=count
        )
        for day, count in day_counter.most_common()
    ]
    
    # Count messages by hour
    hour_counter = Counter([message.timestamp.hour for message in messages])
    message_count_by_hour = [
        MessageCountByHour(
            hour=hour,
            count=count
        )
        for hour, count in sorted(hour_counter.items())
    ]
    
    # Find busiest and quietest days
    busiest_day = day_counter.most_common(1)[0][0] if day_counter else ""
    quietest_day = day_counter.most_common()[-1][0] if day_counter else ""
    
    # Find busiest hour
    busiest_hour = hour_counter.most_common(1)[0][0] if hour_counter else 0
    
    # Calculate average messages per day
    days_in_chat = len(set([message.timestamp.strftime("%Y-%m-%d") for message in messages]))
    average_messages_per_day = total_messages / days_in_chat if days_in_chat > 0 else 0
    
    return ChatStatistics(
        total_messages=total_messages,
        date_range={"start": first_date, "end": last_date},
        message_count_by_user=message_count_by_user,
        message_count_by_day=message_count_by_day,
        message_count_by_hour=message_count_by_hour,
        average_messages_per_day=average_messages_per_day,
        busiest_day=busiest_day,
        quietest_day=quietest_day,
        busiest_hour=busiest_hour
    )

def extract_keywords(messages: List[Message], limit: int = 20) -> KeywordAnalysis:
    """
    Extract top keywords from the chat.
    
    Args:
        messages: List of messages to analyze
        limit: Number of top keywords to return
    
    Returns:
        KeywordAnalysis: Top keywords and their frequencies
    """
    # Combine all message content
    combined_text = " ".join([
        message.content for message in messages 
        if message.type == "text"
    ])
    
    # Tokenize and clean text
    tokens = word_tokenize(combined_text.lower())
    
    # Filter tokens
    filtered_tokens = [
        token for token in tokens
        if token.isalpha()  # Only alphabetic tokens
        and token not in STOP_WORDS  # Not a stopword
        and len(token) > 2  # At least 3 characters
    ]
    
    # Count keywords
    keyword_counter = Counter(filtered_tokens)
    
    # Get top keywords
    top_keywords = [
        KeywordItem(word=word, count=count)
        for word, count in keyword_counter.most_common(limit)
    ]
    
    return KeywordAnalysis(
        keywords=top_keywords,
        total_words=len(filtered_tokens)
    )