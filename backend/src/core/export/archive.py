import zipfile
import json
import os
import logging
from typing import List, Dict, Any
from datetime import datetime
from pathlib import Path

from src.models.schemas import Message
from src.storage.local import get_media

logger = logging.getLogger(__name__)

def create_chat_archive(messages: List[Message], output_path: str, include_media: bool = True) -> str:
    """
    Create a ZIP archive containing chat messages and optionally media.
    
    Args:
        messages: List of messages to include in the archive
        output_path: Path where the ZIP file will be saved
        include_media: Whether to include media files in the archive
    
    Returns:
        str: Path to the created archive
    """
    logger.info(f"Creating chat archive with {len(messages)} messages")
    
    try:
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add messages as JSON
            messages_data = [
                {
                    "id": msg.id,
                    "timestamp": msg.timestamp.isoformat(),
                    "sender": msg.sender,
                    "content": msg.content,
                    "type": msg.type
                }
                for msg in messages
            ]
            
            zipf.writestr('messages.json', json.dumps(messages_data, indent=2))
            
            # Add chat info
            if messages:
                chat_info = {
                    "exported_at": datetime.now().isoformat(),
                    "total_messages": len(messages),
                    "first_message": messages[0].timestamp.isoformat(),
                    "last_message": messages[-1].timestamp.isoformat(),
                    "participants": list(set(msg.sender for msg in messages))
                }
                
                zipf.writestr('chat_info.json', json.dumps(chat_info, indent=2))
            
            # Add media files if requested
            if include_media:
                media_dir = Path("media")
                media_dir.mkdir(exist_ok=True)
                
                for msg in messages:
                    if msg.type in ["image", "video", "audio", "file"]:
                        # Extract media ID from message
                        media_id = msg.id
                        
                        # Try to get media file path
                        media_path = get_media(media_id)
                        
                        if media_path and media_path.exists():
                            # Add file to ZIP
                            zipf.write(
                                media_path,
                                f"media/{media_path.name}"
                            )
        
        logger.info(f"Chat archive created at {output_path}")
        return output_path
    
    except Exception as e:
        logger.error(f"Error creating chat archive: {e}")
        raise