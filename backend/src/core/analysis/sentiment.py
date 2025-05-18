from typing import List, Dict, Any
from datetime import datetime
import logging
from collections import defaultdict
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

from src.models.schemas import Message, SentimentAnalysis, SentimentScore, DailySentiment, SentimentLabel

logger = logging.getLogger(__name__)

# Initialize sentiment analyzer
try:
    nltk.data.find('vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')

sentiment_analyzer = SentimentIntensityAnalyzer()

def analyze_chat_sentiment(messages: List[Message]) -> SentimentAnalysis:
    """
    Analyze sentiment of messages in the chat.
    
    Args:
        messages: List of messages to analyze
    
    Returns:
        SentimentAnalysis: Sentiment analysis results
    """
    if not messages:
        return SentimentAnalysis(
            overall=SentimentScore(score=0.0, label=SentimentLabel.NEUTRAL),
            daily=[]
        )
    
    # Group messages by date
    messages_by_date = defaultdict(list)
    for message in messages:
        # Skip system messages and media
        if message.type != "text":
            continue
        
        date_key = message.timestamp.strftime("%Y-%m-%d")
        messages_by_date[date_key].append(message)
    
    # Calculate sentiment for each day
    daily_sentiments = []
    all_scores = []
    
    for date, date_messages in sorted(messages_by_date.items()):
        # Combine all messages for this date
        combined_text = " ".join([msg.content for msg in date_messages])
        
        # Calculate sentiment
        sentiment = sentiment_analyzer.polarity_scores(combined_text)
        compound_score = sentiment["compound"]
        all_scores.append(compound_score)
        
        # Determine sentiment label
        label = get_sentiment_label(compound_score)
        
        daily_sentiments.append(
            DailySentiment(
                date=date,
                sentiment=SentimentScore(score=compound_score, label=label),
                message_count=len(date_messages)
            )
        )
    
    # Calculate overall sentiment
    overall_score = sum(all_scores) / len(all_scores) if all_scores else 0.0
    overall_label = get_sentiment_label(overall_score)
    
    return SentimentAnalysis(
        overall=SentimentScore(score=overall_score, label=overall_label),
        daily=daily_sentiments
    )

def get_sentiment_label(score: float) -> SentimentLabel:
    """
    Convert sentiment score to label.
    
    Args:
        score: Sentiment score (-1 to 1)
    
    Returns:
        SentimentLabel: Sentiment label (positive, neutral, negative)
    """
    if score >= 0.05:
        return SentimentLabel.POSITIVE
    elif score <= -0.05:
        return SentimentLabel.NEGATIVE
    else:
        return SentimentLabel.NEUTRAL

def analyze_message_sentiment(message: Message) -> SentimentScore:
    """
    Analyze sentiment of a single message.
    
    Args:
        message: Message to analyze
    
    Returns:
        SentimentScore: Sentiment score and label
    """
    if message.type != "text":
        return SentimentScore(score=0.0, label=SentimentLabel.NEUTRAL)
    
    sentiment = sentiment_analyzer.polarity_scores(message.content)
    compound_score = sentiment["compound"]
    label = get_sentiment_label(compound_score)
    
    return SentimentScore(score=compound_score, label=label)