import re
import uuid
from datetime import datetime
from typing import List
import logging

from src.models.schemas import Message, MessageType

# In a real implementation, we would import the Rust module
# But for now, we'll create a fallback Python implementation
try:
    import whatsapp_parser # type: ignore
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
    # Multiple regex patterns for different WhatsApp formats
    patterns = [
        # Format: [DD/MM/YYYY, HH:MM:SS] Sender: Message
        r'^\[(\d{1,2}/\d{1,2}/\d{4}, \d{1,2}:\d{2}:\d{2})\] ([^:]+): (.+)$',
        # Format: DD/MM/YY, HH:MM AM/PM - Sender: Message (with case-insensitive am/pm)
        r'^(\d{1,2}/\d{1,2}/\d{2,4}, \d{1,2}:\d{2} (?:AM|PM|am|pm)) - ([^:]+): (.+)$',
        # Format: DD/MM/YYYY, HH:MM - Sender: Message
        r'^(\d{1,2}/\d{1,2}/\d{4}, \d{1,2}:\d{2}) - ([^:]+): (.+)$',
        # Format: MM/DD/YY, HH:MM - Sender: Message
        r'^(\d{1,2}/\d{1,2}/\d{2,4}, \d{1,2}:\d{2}) - ([^:]+): (.+)$'    ]
    
    compiled_patterns = [re.compile(pattern) for pattern in patterns]
    
    # System message patterns to exclude
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
        r"Verified by WhatsApp",        r"\+\d{1,3} \d{1,4} \d{3,4} \d{4}",  # Phone numbers
        r"^\d{1,2}\/\d{1,2}\/\d{2,4}",  # Lines that start with just dates
        r"^[A-Z]{3} \d{1,2}, \d{4}",  # Month abbreviations like "JAN 15, 2024"
    ]
    
    def is_system_message(content: str) -> bool:
        """Check if a message is a system message that should be excluded"""
        for pattern in system_message_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return True
        return False
    
    messages = []
    current_message = None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            for line in file:
                line = line.strip()
                
                # Skip lines that are clearly system messages without participants
                # Pattern: DD/MM/YY, HH:MM am/pm - System message (no participant name)
                if re.match(r'^\d{1,2}/\d{1,2}/\d{2,4}, \d{1,2}:\d{2} (?:AM|PM|am|pm) - [^:]*$', line):
                    continue
                
                match = None
                
                # Try each pattern until one matches
                for regex in compiled_patterns:
                    match = regex.match(line)
                    if match:
                        break
                
                if match:
                    # If we have a current message being built, add it to the list
                    if current_message:
                        # Check if it's a system message before adding
                        if not is_system_message(current_message["content"]):
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
            if current_message and not is_system_message(current_message["content"]):
                messages.append(create_message_object(current_message))
        
        return messages
    
    except Exception as e:
        logger.error(f"Error parsing WhatsApp chat with Python: {e}")
        raise

def parse_whatsapp_timestamp(timestamp_str: str) -> datetime:
    """
    Parse WhatsApp timestamp in various formats
    """
    # First try to handle lowercase am/pm by converting to uppercase
    timestamp_str_upper = timestamp_str.replace(' am', ' AM').replace(' pm', ' PM')
    
    timestamp_formats = [
        "%d/%m/%Y, %H:%M:%S",     # [DD/MM/YYYY, HH:MM:SS]
        "%d/%m/%y, %I:%M %p",     # DD/MM/YY, HH:MM AM/PM  
        "%m/%d/%y, %I:%M %p",     # MM/DD/YY, HH:MM AM/PM
        "%m/%d/%Y, %I:%M %p",     # MM/DD/YYYY, HH:MM AM/PM
        "%d/%m/%Y, %H:%M",        # DD/MM/YYYY, HH:MM
        "%m/%d/%y, %H:%M",        # MM/DD/YY, HH:MM
        "%m/%d/%Y, %H:%M"         # MM/DD/YYYY, HH:MM
    ]
    
    for fmt in timestamp_formats:
        try:
            return datetime.strptime(timestamp_str_upper, fmt)
        except ValueError:
            continue
    
    logger.error(f"Unable to parse timestamp: {timestamp_str}")
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