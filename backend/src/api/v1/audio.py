from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query, Form # type: ignore
from fastapi.responses import StreamingResponse # type: ignore
from typing import List, Optional, Dict, Any
import os
import uuid
import aiofiles # type: ignore
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session # type: ignore

from src.models.database import get_db, AudioRecording as AudioRecordingModel
from src.utils.auth import get_current_user_optional
from src.utils.security import sanitize_input, validate_file_upload

router = APIRouter(
    prefix="/audio",
    tags=["audio"],
    responses={404: {"description": "Not found"}},
)

# Configure storage directory
AUDIO_STORAGE_DIR = Path("storage/audio")
AUDIO_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_audio(
    file: UploadFile = File(...),
    chat_id: Optional[str] = None,
    journal_entry_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Upload an audio file and store it with metadata
    """
    try:
        # Validate file
        validate_file_upload(
            file, 
            allowed_extensions=[".mp3", ".wav", ".m4a", ".ogg", ".webm"],
            max_size_mb=100
        )
        
        # Sanitize inputs
        if chat_id:
            chat_id = sanitize_input(chat_id)
        if journal_entry_id:
            journal_entry_id = sanitize_input(journal_entry_id)
            
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix.lower()
        safe_filename = f"{file_id}{file_extension}"
        file_path = AUDIO_STORAGE_DIR / safe_filename
        
        # Save file to disk
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
            file_size = len(content)
        
        # Create database record
        audio_record = AudioRecordingModel(
            id=file_id,
            chat_id=chat_id,
            journal_entry_id=journal_entry_id,
            filename=sanitize_input(file.filename),
            file_path=str(file_path),
            file_size=file_size,
            created_at=datetime.utcnow()
        )
        
        db.add(audio_record)
        db.commit()
        db.refresh(audio_record)
        
        return {
            "id": audio_record.id,
            "filename": audio_record.filename,
            "file_size": audio_record.file_size,
            "chat_id": audio_record.chat_id,
            "journal_entry_id": audio_record.journal_entry_id,
            "upload_time": audio_record.created_at.isoformat(),
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up file if it was created
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/recordings")
async def get_recordings(
    chat_id: Optional[str] = Query(None),
    journal_entry_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Get a list of audio recordings with optional filtering
    """
    try:
        # Build query
        query = db.query(AudioRecordingModel)
        
        # Apply filters
        if chat_id:
            chat_id = sanitize_input(chat_id)
            query = query.filter(AudioRecordingModel.chat_id == chat_id)
            
        if journal_entry_id:
            journal_entry_id = sanitize_input(journal_entry_id)
            query = query.filter(AudioRecordingModel.journal_entry_id == journal_entry_id)
        
        # Get paginated results
        recordings = query.order_by(AudioRecordingModel.created_at.desc()).offset(skip).limit(limit).all()
        
        recording_list = []
        for recording in recordings:
            recording_list.append({
                "id": recording.id,
                "filename": recording.filename,
                "duration": recording.duration,
                "file_size": recording.file_size,
                "chat_id": recording.chat_id,
                "journal_entry_id": recording.journal_entry_id,
                "transcription": recording.transcription,
                "uploaded_at": recording.created_at.isoformat(),
                "transcribed": recording.transcription is not None
            })
        
        return {
            "recordings": recording_list,
            "count": len(recording_list),
            "pagination": {
                "skip": skip,
                "limit": limit,
                "has_more": len(recording_list) == limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving recordings: {str(e)}")

@router.get("/recordings/{recording_id}")
async def get_recording(
    recording_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Get a specific audio recording's metadata
    """
    try:
        recording_id = sanitize_input(recording_id)
        
        recording = db.query(AudioRecordingModel).filter(AudioRecordingModel.id == recording_id).first()
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        return {
            "id": recording.id,
            "filename": recording.filename,
            "duration": recording.duration,
            "file_size": recording.file_size,
            "chat_id": recording.chat_id,
            "journal_entry_id": recording.journal_entry_id,
            "transcription": recording.transcription,
            "uploaded_at": recording.created_at.isoformat(),
            "transcribed": recording.transcription is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving recording: {str(e)}")

@router.get("/recordings/{recording_id}/download")
async def download_recording(
    recording_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Download an audio recording file
    """
    try:
        recording_id = sanitize_input(recording_id)
        
        recording = db.query(AudioRecordingModel).filter(AudioRecordingModel.id == recording_id).first()
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        file_path = Path(recording.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Audio file not found on disk")
        
        def iterfile():
            with open(file_path, mode="rb") as file_like:
                yield from file_like
        
        return StreamingResponse(
            iterfile(),
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"attachment; filename={recording.filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading recording: {str(e)}")

@router.post("/transcribe/{recording_id}")
async def transcribe_audio(
    recording_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Transcribe an audio recording (placeholder - would integrate with speech-to-text service)
    """
    try:
        recording_id = sanitize_input(recording_id)
        
        recording = db.query(AudioRecordingModel).filter(AudioRecordingModel.id == recording_id).first()
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        # In a real implementation, you would:
        # 1. Send the audio file to a transcription service (Whisper, AssemblyAI, etc.)
        # 2. Poll for completion or use webhooks
        # 3. Update the database with the transcription
        
        # For now, return a placeholder response
        return {
            "recording_id": recording_id,
            "status": "processing",
            "message": "Transcription has been queued for processing",
            "estimated_completion_time": "5-10 minutes",
            "progress": 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting transcription: {str(e)}")

@router.get("/transcribe/{recording_id}/status")
async def get_transcription_status(
    recording_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Get the status of an audio transcription
    """
    try:
        recording_id = sanitize_input(recording_id)
        
        recording = db.query(AudioRecordingModel).filter(AudioRecordingModel.id == recording_id).first()
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        if recording.transcription:
            return {
                "recording_id": recording_id,
                "status": "completed",
                "transcription": recording.transcription,
                "completed_at": recording.created_at.isoformat()  # In real implementation, track completion time
            }
        else:
            return {
                "recording_id": recording_id,
                "status": "processing",
                "progress": 50,  # Placeholder progress
                "message": "Transcription in progress"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting transcription status: {str(e)}")

@router.delete("/recordings/{recording_id}")
async def delete_recording(
    recording_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Delete an audio recording and its file
    """
    try:
        recording_id = sanitize_input(recording_id)
        
        recording = db.query(AudioRecordingModel).filter(AudioRecordingModel.id == recording_id).first()
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        # Delete file from disk
        file_path = Path(recording.file_path)
        if file_path.exists():
            file_path.unlink()
        
        # Delete database record
        db.delete(recording)
        db.commit()
        
        return {
            "success": True,
            "message": f"Recording {recording_id} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting recording: {str(e)}")

@router.delete("/{audio_id}")
async def delete_audio_recording(
    audio_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Delete an audio recording"""
    try:
        # Get recording from database
        recording = db.query(AudioRecordingModel).filter(AudioRecordingModel.id == audio_id).first()
        if not recording:
            raise HTTPException(status_code=404, detail="Audio recording not found")
        
        # Delete file from storage
        if os.path.exists(recording.file_path):
            os.remove(recording.file_path)
        
        # Delete from database
        db.delete(recording)
        db.commit()
        
        return {"message": "Audio recording deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting audio recording {audio_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete audio recording: {str(e)}")

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("en-US"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Transcribe audio file to text"""
    try:
        # Validate file type
        allowed_extensions = ["mp3", "wav", "m4a", "ogg", "webm"]
        if not validate_file_type(audio.filename or "", allowed_extensions):
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Validate file size (max 50MB)
        content = await audio.read()
        if not validate_file_size(len(content), max_size_mb=50):
            raise HTTPException(status_code=400, detail="File too large. Maximum size: 50MB")
        
        # Save temporary file
        temp_filename = f"temp_audio_{generate_random_token(8)}.{audio.filename.split('.')[-1]}"
        temp_path = AUDIO_STORAGE_DIR / temp_filename
        
        with open(temp_path, "wb") as f:
            f.write(content)
        
        try:
            # Perform transcription (placeholder implementation)
            # In a real implementation, you would integrate with:
            # - OpenAI Whisper API
            # - Google Speech-to-Text
            # - Azure Cognitive Services
            # - AWS Transcribe
            
            transcript = await perform_audio_transcription(temp_path, language)
            confidence = 0.95  # Placeholder confidence score
            
            return {
                "transcript": transcript,
                "confidence": confidence,
                "language": language,
                "duration": get_audio_duration(temp_path),
                "status": "completed"
            }
            
        finally:
            # Clean up temporary file
            if temp_path.exists():
                os.remove(temp_path)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.get("/transcription-status/{task_id}")
async def get_transcription_status(
    task_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get the status of an audio transcription task"""
    try:
        # In a real implementation, you would track transcription tasks
        # This is a placeholder that always returns completed status
        return {
            "status": "completed",
            "progress": 100,
            "transcript": "Sample transcription result",
            "confidence": 0.95
        }
        
    except Exception as e:
        logger.error(f"Error getting transcription status for {task_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get transcription status: {str(e)}")

# Helper functions for audio transcription
async def perform_audio_transcription(audio_path: Path, language: str) -> str:
    """
    Perform audio transcription using available service
    This is a placeholder implementation
    """
    try:
        # Option 1: OpenAI Whisper (requires openai library)
        # import openai
        # with open(audio_path, "rb") as audio_file:
        #     transcript = openai.Audio.transcribe("whisper-1", audio_file, language=language)
        #     return transcript["text"]
        
        # Option 2: Google Speech-to-Text (requires google-cloud-speech)
        # from google.cloud import speech
        # client = speech.SpeechClient()
        # with open(audio_path, "rb") as audio_file:
        #     content = audio_file.read()
        # audio = speech.RecognitionAudio(content=content)
        # config = speech.RecognitionConfig(
        #     encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        #     language_code=language,
        # )
        # response = client.recognize(config=config, audio=audio)
        # return " ".join([result.alternatives[0].transcript for result in response.results])
        
        # Placeholder implementation
        duration = get_audio_duration(audio_path)
        return f"Transcribed audio content for {duration} second audio file in {language}"
        
    except Exception as e:
        logger.error(f"Error in audio transcription: {e}")
        raise Exception(f"Transcription service error: {str(e)}")

def get_audio_duration(audio_path: Path) -> float:
    """
    Get audio file duration in seconds
    This is a placeholder implementation
    """
    try:
        # Option 1: Using pydub (requires pydub and ffmpeg)
        # from pydub import AudioSegment
        # audio = AudioSegment.from_file(str(audio_path))
        # return len(audio) / 1000.0  # Convert milliseconds to seconds
        
        # Option 2: Using mutagen (requires mutagen library)
        # from mutagen import File
        # audio_file = File(str(audio_path))
        # return audio_file.info.length if audio_file and audio_file.info else 0.0
        
        # Placeholder: estimate based on file size (very rough approximation)
        file_size_mb = audio_path.stat().st_size / (1024 * 1024)
        estimated_duration = file_size_mb * 60  # Rough estimate: 1MB ≈ 1 minute
        return min(estimated_duration, 3600)  # Cap at 1 hour
        
    except Exception:
        return 0.0