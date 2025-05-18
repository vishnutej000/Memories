from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, FileResponse
import io
import json
import logging
from typing import List
from pathlib import Path
import tempfile

from src.models.schemas import Message
from src.core.export.pdf import generate_chat_pdf
from src.core.export.archive import create_chat_archive
from src.storage.local import get_messages

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/export/pdf")
async def export_pdf(
    include_media: bool = Query(True),
    start_date: str = Query(None),
    end_date: str = Query(None),
):
    """
    Export chat as PDF.
    
    Args:
        include_media: Whether to include media in the export
        start_date: Filter messages after this date (YYYY-MM-DD)
        end_date: Filter messages before this date (YYYY-MM-DD)
    
    Returns:
        StreamingResponse: PDF file stream
    """
    try:
        messages = get_messages()
        
        if not messages:
            raise HTTPException(
                status_code=404,
                detail="No chat data found. Please import a chat first."
            )
        
        # Filter messages by date if specified
        if start_date:
            messages = [msg for msg in messages if msg.timestamp >= start_date]
        
        if end_date:
            messages = [msg for msg in messages if msg.timestamp <= end_date]
        
        # Generate PDF
        pdf_bytes = generate_chat_pdf(messages, include_media)
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=whatsapp_chat.pdf"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting PDF: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export chat as PDF: {str(e)}"
        )

@router.get("/export/json")
async def export_json():
    """
    Export chat as JSON.
    
    Returns:
        StreamingResponse: JSON file stream
    """
    try:
        messages = get_messages()
        
        if not messages:
            raise HTTPException(
                status_code=404,
                detail="No chat data found. Please import a chat first."
            )
        
        # Convert to JSON
        messages_json = json.dumps(
            [msg.dict() for msg in messages], 
            indent=2,
            default=str  # Handle datetime serialization
        )
        
        return StreamingResponse(
            io.BytesIO(messages_json.encode()),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=whatsapp_chat.json"}
        )
    
    except Exception as e:
        logger.error(f"Error exporting JSON: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export chat as JSON: {str(e)}"
        )

@router.get("/export/archive")
async def export_archive(include_media: bool = Query(True)):
    """
    Export complete chat archive including media.
    
    Args:
        include_media: Whether to include media in the archive
    
    Returns:
        FileResponse: ZIP file download
    """
    try:
        messages = get_messages()
        
        if not messages:
            raise HTTPException(
                status_code=404,
                detail="No chat data found. Please import a chat first."
            )
        
        # Create temporary file for the archive
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_file:
            temp_path = Path(temp_file.name)
        
        # Create archive
        create_chat_archive(messages, str(temp_path), include_media)
        
        return FileResponse(
            path=temp_path,
            filename="whatsapp_chat_archive.zip",
            media_type="application/zip",
            background=lambda: temp_path.unlink()  # Delete file after download
        )
    
    except Exception as e:
        logger.error(f"Error creating archive: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create chat archive: {str(e)}"
        )