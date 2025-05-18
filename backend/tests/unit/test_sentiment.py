import pytest # type: ignore
from datetime import datetime
from core.analysis.sentiment import analyze_chat_sentiment, get_sentiment_label # type: ignore
from models.schemas import Message, MessageType, SentimentLabel # type: ignore

def test_get_sentiment_label():
    """Test sentiment label classification."""
    assert get_sentiment_label(0.5) == SentimentLabel.POSITIVE
    assert get_sentiment_label(0.04) == SentimentLabel.NEUTRAL
    assert get_sentiment_label(0.0) == SentimentLabel.NEUTRAL
    assert get_sentiment_label(-0.04) == SentimentLabel.NEUTRAL
    assert get_sentiment_label(-0.5) == SentimentLabel.NEGATIVE

def test_analyze_chat_sentiment_empty():
    """Test sentiment analysis with empty message list."""
    result = analyze_chat_sentiment([])
    assert result.overall.score == 0.0
    assert result.overall.label == SentimentLabel.NEUTRAL
    assert len(result.daily) == 0

def test_analyze_chat_sentiment_positive():
    """Test sentiment analysis with positive messages."""
    messages = [
        Message(
            id="1", 
            timestamp=datetime(2023, 5, 18, 8, 0, 0), 
            sender="John", 
            content="I'm very happy today! This is wonderful.", 
            type=MessageType.TEXT
        ),
        Message(
            id="2", 
            timestamp=datetime(2023, 5, 18, 9, 0, 0), 
            sender="Alice", 
            content="That's great! I'm excited to hear that.", 
            type=MessageType.TEXT
        )
    ]
    
    result = analyze_chat_sentiment(messages)
    assert result.overall.score > 0
    assert result.overall.label == SentimentLabel.POSITIVE
    assert len(result.daily) == 1
    assert result.daily[0].date == "2023-05-18"

def test_analyze_chat_sentiment_negative():
    """Test sentiment analysis with negative messages."""
    messages = [
        Message(
            id="1", 
            timestamp=datetime(2023, 5, 18, 8, 0, 0), 
            sender="John", 
            content="I'm sad and upset today. Everything is terrible.", 
            type=MessageType.TEXT
        ),
        Message(
            id="2", 
            timestamp=datetime(2023, 5, 18, 9, 0, 0), 
            sender="Alice", 
            content="I'm sorry to hear that. That's disappointing.", 
            type=MessageType.TEXT
        )
    ]
    
    result = analyze_chat_sentiment(messages)
    assert result.overall.score < 0
    assert result.overall.label == SentimentLabel.NEGATIVE
    assert len(result.daily) == 1

def test_analyze_chat_sentiment_mixed():
    """Test sentiment analysis with mixed messages across multiple days."""
    messages = [
        Message(
            id="1", 
            timestamp=datetime(2023, 5, 18, 8, 0, 0), 
            sender="John", 
            content="I'm sad today.", 
            type=MessageType.TEXT
        ),
        Message(
            id="2", 
            timestamp=datetime(2023, 5, 19, 9, 0, 0), 
            sender="Alice", 
            content="I'm happy today!", 
            type=MessageType.TEXT
        )
    ]
    
    result = analyze_chat_sentiment(messages)
    assert len(result.daily) == 2
    
    # First day should be negative
    assert result.daily[0].date == "2023-05-18"
    assert result.daily[0].sentiment.label == SentimentLabel.NEGATIVE
    
    # Second day should be positive
    assert result.daily[1].date == "2023-05-19"
    assert result.daily[1].sentiment.label == SentimentLabel.POSITIVE

def test_analyze_chat_sentiment_non_text():
    """Test sentiment analysis with non-text messages."""
    messages = [
        Message(
            id="1", 
            timestamp=datetime(2023, 5, 18, 8, 0, 0), 
            sender="John", 
            content="<Media omitted>", 
            type=MessageType.IMAGE
        ),
        Message(
            id="2", 
            timestamp=datetime(2023, 5, 18, 9, 0, 0), 
            sender="Alice", 
            content="I'm happy today!", 
            type=MessageType.TEXT
        )
    ]
    
    result = analyze_chat_sentiment(messages)
    # Non-text messages should be ignored
    assert result.overall.label == SentimentLabel.POSITIVE