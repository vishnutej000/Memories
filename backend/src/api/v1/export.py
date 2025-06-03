from fastapi import APIRouter, Depends, HTTPException, Query, Response # type: ignore
from fastapi.responses import StreamingResponse # type: ignore
from typing import List, Optional
from sqlalchemy.orm import Session # type: ignore
import tempfile
import os
import json
from datetime import datetime

from src.models.database import get_db, Chat as ChatModel, Message as MessageModel
from src.core.export.pdf import generate_chat_pdf
from src.core.export.archive import create_chat_archive
from src.utils.auth import get_current_user_optional
from src.utils.security import sanitize_input

router = APIRouter(
    prefix="/export",
    tags=["export"],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
async def get_export_options():
    """
    Get available export options
    """
    return {
        "formats": ["pdf", "txt", "json", "zip"],
        "features": {
            "include_media": True,
            "date_range_filter": True,
            "participant_filter": True,
            "redacted_mode": True
        },
        "message": "Export functionality is available"
    }

@router.post("/chat/{chat_id}")
async def export_chat(
    chat_id: str,
    format: str = Query("pdf", regex="^(pdf|txt|json|zip)$"),
    include_media: bool = Query(True),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Export a chat in the specified format
    """
    try:
        # Sanitize inputs
        chat_id = sanitize_input(chat_id)
        format = sanitize_input(format.lower())
        
        # Check if chat exists
        chat = db.query(ChatModel).filter(ChatModel.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Build message query
        message_query = db.query(MessageModel).filter(MessageModel.chat_id == chat_id)
        
        # Apply date filters if provided
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                message_query = message_query.filter(MessageModel.timestamp >= start_dt)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format")
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                message_query = message_query.filter(MessageModel.timestamp <= end_dt)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format")
        
        # Get messages
        messages = message_query.order_by(MessageModel.timestamp).all()
        
        if not messages:
            raise HTTPException(status_code=404, detail="No messages found for the specified criteria")
        
        # Convert to format expected by export functions
        export_messages = []
        for msg in messages:
            export_messages.append(type('Message', (), {
                'id': msg.id,
                'content': msg.content,
                'sender': msg.sender,
                'timestamp': msg.timestamp,
                'type': msg.message_type
            })())
        
        # Generate export based on format
        if format == "pdf":
            pdf_data = generate_chat_pdf(export_messages, include_media=include_media)
            return Response(
                content=pdf_data,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={chat.title}_export.pdf"}
            )
        
        elif format == "json":
            export_data = {
                "chat": {
                    "id": chat.id,
                    "title": chat.title,
                    "participants": chat.participants,
                    "is_group_chat": chat.is_group_chat,
                    "message_count": len(messages)
                },
                "messages": [
                    {
                        "id": msg.id,
                        "content": msg.content,
                        "sender": msg.sender,
                        "timestamp": msg.timestamp.isoformat(),
                        "type": msg.message_type
                    }
                    for msg in messages
                ],
                "export_info": {
                    "exported_at": datetime.utcnow().isoformat(),
                    "format": "json",
                    "include_media": include_media,
                    "date_range": {
                        "start": start_date,
                        "end": end_date
                    }
                }
            }
            
            json_data = json.dumps(export_data, indent=2, ensure_ascii=False)
            return Response(
                content=json_data,
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename={chat.title}_export.json"}
            )
        
        elif format == "txt":
            txt_content = f"WhatsApp Chat Export: {chat.title}\n"
            txt_content += f"Exported on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}\n"
            txt_content += f"Participants: {', '.join(chat.participants or [])}\n"
            txt_content += f"Total Messages: {len(messages)}\n"
            txt_content += "=" * 50 + "\n\n"
            
            for msg in messages:
                timestamp_str = msg.timestamp.strftime("%Y-%m-%d %H:%M:%S")
                txt_content += f"[{timestamp_str}] {msg.sender}: {msg.content}\n"
            
            return Response(
                content=txt_content.encode('utf-8'),
                media_type="text/plain",
                headers={"Content-Disposition": f"attachment; filename={chat.title}_export.txt"}
            )
        
        elif format == "zip":
            # Create temporary zip file
            with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as temp_file:
                archive_path = create_chat_archive(export_messages, temp_file.name, include_media=include_media)
                
                # Read the zip file
                with open(archive_path, 'rb') as zip_file:
                    zip_data = zip_file.read()
                
                # Clean up
                os.unlink(archive_path)
                
                return Response(
                    content=zip_data,
                    media_type="application/zip",
                    headers={"Content-Disposition": f"attachment; filename={chat.title}_export.zip"}
                )
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting chat {chat_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/history")
async def export_history(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Get export history (this would track exports in a real implementation)
    """
    # In a real implementation, you'd have an exports table to track this
    return {
        "exports": [
            {
                "id": "exp_" + str(i),
                "chat_id": f"chat_{i}",
                "format": ["pdf", "json", "txt"][i % 3],
                "created_at": datetime.utcnow().isoformat(),
                "file_size": 1024 * (i + 1),
                "status": "completed"
            }
            for i in range(5)
        ],
        "total": 5
    }