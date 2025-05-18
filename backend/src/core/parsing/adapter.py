import re
import uuid
from datetime import datetime
from typing import List
import logging

from src.models.schemas import Message, MessageType

# In a real implementation, we would import the Rust module
# But for now, we'll create a fallback Python implementation
try:
    import whatsapp_parser
    RUST_PARSER_AVAILABLE = True
except ImportError:
    RUST_PARSER_AVAILABLE = False
    logging.warning("Rust parser not available. Using Python fallback.")

logger = logging.getLogger(__name__)

def parse_whatsapp_chat(file_path: str, user_identity: str) -> List[Message]:
    """
    Parse a WhatsApp chat export file and extract messages.
    
    Args:
        file_path: Path to the WhatsApp chat export file
        user_identity: The name of the current user in the chat
    
    Returns:
        List[Message]: The parsed messages
    """
    if RUST_PARSER_AVAILABLE:
        logger.info("Using Rust parser for WhatsApp chat")
        return parse_with_rust(file_path, user_identity)
    else:
        logger.info("Using Python fallback parser for WhatsApp chat")
        return parse_with_python(file_path, user_identity)

def parse_with_rust(file_path: str, user_identity: str) -> List[Message]:
    """
    Parse WhatsApp chat using the Rust parser.
    """
    try:
        # Call the Rust function
        messages_data = whatsapp_parser.parse_whatsapp_chat(file_path, user_identity)
        
        # Convert to Message objects
        messages = []
        for msg in messages_data:
            messages.append(
                Message(
                    id=msg["id"],
                    timestamp=datetime.fromisoformat(msg["timestamp"]),
                    sender=msg["sender"],
                    content=msg["content"],
                    type=get_message_type(msg["type"], msg["content"])
                )
            )
        
        return messages
    except Exception as e:
        logger.error(f"Rust parser error: {e}")
        # Fallback to Python parser
        return parse_with_python(file_path, user_identity)

def parse_with_python(file_path: str, user_identity: str) -> List[Message]:
    """
    Python fallback implementation for parsing WhatsApp chat exports.
    """
    # Regex for WhatsApp timestamp and sender
    pattern = r'^\[(\d{2}/\d{2}/\d{4}, \d{2}:\d{2}:\d{2})\] ([^:]+): (.+)$'
    regex = re.compile(pattern)
    
    messages = []
    current_message = None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            for line in file:
                line = line.strip()
                match = regex.match(line)
                
                if match:
                    # If we have a current message being built, add it to the list
                    if current_message:
                        messages.append(create_message_object(current_message))
                    
                    # Extract data from the new message
                    timestamp_str, sender, content = match.groups()
                    timestamp = parse_whatsapp_timestamp(timestamp_str)
                    
                    # Start building a new message
                    current_message = {
                        "id": f"msg_{uuid.uuid4().hex[:8]}",
                        "timestamp": timestamp,
                        "sender": sender,
                        "content": content,
                        "type": "text"  # Default type, will be updated later
                    }
                elif current_message:
                    # This line is a continuation of the previous message
                    current_message["content"] += f"\n{line}"
            
            # Don't forget the last message
            if current_message:
                messages.append(create_message_object(current_message))
        
        return messages
    
    except Exception as e:
        logger.error(f"Error parsing WhatsApp chat with Python: {e}")
        raise

def parse_whatsapp_timestamp(timestamp_str: str) -> datetime:
    """
    Parse WhatsApp timestamp in format "DD/MM/YYYY, HH:MM:SS"
    """
    try:
        return datetime.strptime(timestamp_str, "%d/%m/%Y, %H:%M:%S")
    except ValueError as e:
        logger.error(f"Error parsing timestamp: {e}")
        # Fallback to current time if parsing fails
        return datetime.now()

def create_message_object(message_data: dict) -> Message:
    """
    Create a Message object from parsed data.
    """
    # Determine message type based on content
    message_type = get_message_type(message_data["type"], message_data["content"])
    
    return Message(
        id=message_data["id"],
        timestamp=message_data["timestamp"],
        sender=message_data["sender"],
        content=message_data["content"],
        type=message_type
    )

def get_message_type(type_hint: str, content: str) -> MessageType:
    """
    Determine message type based on content.
    """
    content_lower = content.lower()
    
    if "<media omitted>" in content_lower:
        # Try to determine media type
        if any(kw in content_lower for kw in ["image", "photo", "picture"]):
            return MessageType.IMAGE
        elif any(kw in content_lower for kw in ["video", "movie", "clip"]):
            return MessageType.VIDEO
        elif any(kw in content_lower for kw in ["audio", "voice", "sound"]):
            return MessageType.AUDIO
        else:
            return MessageType.FILE
    elif content.startswith("https://") or content.startswith("http://"):
        # Links are still text messages but could be processed differently
        return MessageType.TEXT
    elif any(kw in content_lower for kw in ["location", "latitude", "longitude"]):
        return MessageType.LOCATION
    elif "contact" in content_lower and "card" in content_lower:
        return MessageType.CONTACT
    else:
        return MessageType.TEXT