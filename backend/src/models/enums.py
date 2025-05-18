from enum import Enum

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

class ExportFormat(str, Enum):
    PDF = "pdf"
    JSON = "json"
    ZIP = "zip"