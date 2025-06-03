# Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-05-19 07:58:51
# Current User's Login: vishnutej000

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer
import time
import logging
from typing import Dict, Any, List, Optional
import json
from datetime import datetime
from textblob import TextBlob
import os
from pathlib import Path
import shutil
from src.core.parsing.adapter import parse_with_python
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("memories-api")

# Import your existing routers
from src.api.v1.chats import router as chats_router
from src.api.v1.export import router as export_router
from src.api.v1.audio import router as audio_router
from src.utils.security import SecurityMiddleware, RateLimitMiddleware
from src.models.database import create_tables

# Initialize database
create_tables()

app = FastAPI(
    title="WhatsApp Memory Vault API", 
    version="1.0.0",
    description="Secure API for managing and analyzing WhatsApp chat exports",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Security middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "*.localhost"])
app.add_middleware(SecurityMiddleware)
app.add_middleware(RateLimitMiddleware, calls=100, period=60)  # 100 calls per minute

# Add CORS middleware with secure configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Specific origins in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["Content-Disposition"]
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Process the request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Log the request
    logger.info(
        f"{request.client.host} - {request.method} {request.url.path} - "
        f"{response.status_code} - {process_time:.4f}s"
    )
    
    return response

# Include your routers
app.include_router(chats_router, prefix="/api/v1")
app.include_router(export_router, prefix="/api/v1")
app.include_router(audio_router, prefix="/api/v1")

# Health check endpoint with explicit JSONResponse
@app.get("/health", tags=["Health"])
async def health_check() -> JSONResponse:
    """
    Health check endpoint for API connectivity testing
    """
    return JSONResponse(
        content={
            "status": "healthy", 
            "version": "1.0.0",
            "timestamp": time.time()
        },
        status_code=200,
        media_type="application/json"
    )

# Add compatibility endpoints for singular 'chat' path
@app.get("/api/v1/chat", tags=["Compatibility"])
@app.post("/api/v1/chat", tags=["Compatibility"])
@app.put("/api/v1/chat", tags=["Compatibility"])
@app.delete("/api/v1/chat", tags=["Compatibility"])
async def chat_redirect() -> JSONResponse:
    """
    Compatibility endpoint that redirects to the plural form
    """
    return JSONResponse(
        content={
            "message": "This endpoint is deprecated. Please use /api/v1/chats instead.",
            "plural_endpoint": "/api/v1/chats"
        },
        status_code=200,
        media_type="application/json"
    )

# Root endpoint with API information
@app.get("/", tags=["Root"])
async def root() -> JSONResponse:
    """
    Root endpoint with API information
    """
    return JSONResponse(
        content={
            "api": "WhatsApp Memory Vault API",
            "version": "1.0.0",
            "docs_url": "/docs",
            "endpoints": {
                "health": "/health",
                "chats": "/api/v1/chats",
                "export": "/api/v1/export",
                "audio": "/api/v1/audio"
            }
        },
        status_code=200,
        media_type="application/json"
    )

# Handle 404 errors with JSON instead of HTML
@app.exception_handler(404)
async def custom_404_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Custom 404 handler to return JSON instead of HTML
    This prevents the 'Unexpected token <' error in the frontend
    """
    logger.warning(f"404 Not Found: {request.method} {request.url.path}")
    return JSONResponse(
        status_code=404,
        content={"detail": "Path not found", "path": request.url.path},
        media_type="application/json"
    )

# Add fallback route for any URL not found
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], include_in_schema=False)
async def catch_all(request: Request, path: str) -> JSONResponse:
    """
    Catch-all route to handle any frontend routes not found
    """
    # Log the attempted access
    logger.warning(f"Attempted to access undefined route: {request.method} {request.url.path}")
    
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Path not found", 
            "path": request.url.path,
            "method": request.method,
            "suggestion": "Check the API documentation at /docs"
        },
        media_type="application/json"
    )

# Add startup event handler
@app.on_event("startup")
async def startup_event():
    """
    Log when the server starts
    """
    logger.info("🚀 WhatsApp Memory Vault API server started")
    logger.info(f"API Documentation available at: http://localhost:8000/docs")

# Storage configuration
STORAGE_DIR = Path("storage")
CHATS_DIR = STORAGE_DIR / "chats"
AUDIO_DIR = STORAGE_DIR / "audio"
DIARY_DIR = STORAGE_DIR / "diary"

# Create directories if they don't exist
for directory in [CHATS_DIR, AUDIO_DIR, DIARY_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

class Message(BaseModel):
    timestamp: datetime
    sender: str
    content: str
    message_type: str
    sentiment_score: Optional[float] = None

class ChatSession(BaseModel):
    id: str
    messages: List[Message]
    participants: List[str]
    start_date: datetime
    end_date: datetime

@app.post("/api/upload")
async def upload_chat(file: UploadFile = File(...)):
    try:
        # Save uploaded file
        file_path = CHATS_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse chat
        messages = parse_with_python(str(file_path), user_identity="user")
        
        # Detect senders
        senders = parser.detect_senders(str(file_path))
        
        # Calculate sentiment scores
        for message in messages:
            if message.message_type == "Text":
                blob = TextBlob(message.content)
                message.sentiment_score = blob.sentiment.polarity
        
        # Create session
        session = ChatSession(
            id=file.filename,
            messages=messages,
            participants=senders,
            start_date=messages[0].timestamp,
            end_date=messages[-1].timestamp
        )
        
        # Save session
        session_path = CHATS_DIR / f"{file.filename}.json"
        with session_path.open("w") as f:
            json.dump(session.dict(), f, default=str)
        
        return {"status": "success", "session_id": file.filename}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions")
async def list_sessions():
    sessions = []
    for file in CHATS_DIR.glob("*.json"):
        with file.open("r") as f:
            session = json.load(f)
            sessions.append(session)
    return sessions

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    session_path = CHATS_DIR / f"{session_id}.json"
    if not session_path.exists():
        raise HTTPException(status_code=404, detail="Session not found")
    
    with session_path.open("r") as f:
        return json.load(f)

@app.post("/api/session/{session_id}/diary")
async def add_diary_entry(session_id: str, entry: dict):
    diary_path = DIARY_DIR / f"{session_id}_diary.json"
    entries = []
    
    if diary_path.exists():
        with diary_path.open("r") as f:
            entries = json.load(f)
    
    entries.append({
        "timestamp": datetime.now().isoformat(),
        "content": entry["content"],
        "mood": entry.get("mood"),
        "tags": entry.get("tags", [])
    })
    
    with diary_path.open("w") as f:
        json.dump(entries, f)
    
    return {"status": "success"}

@app.post("/api/session/{session_id}/audio")
async def save_audio_note(session_id: str, file: UploadFile = File(...)):
    try:
        audio_path = AUDIO_DIR / f"{session_id}_{file.filename}"
        with audio_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"status": "success", "path": str(audio_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-sentiment")
async def analyze_sentiment(data: dict = Body(...)):
    text = data.get("text", "")
    if not text:
        return {"sentiment_score": 0.0}
    blob = TextBlob(text)
    return {"sentiment_score": blob.sentiment.polarity}

@app.post("/api/analyze-batch-sentiment")
async def analyze_batch_sentiment(data: dict = Body(...)):
    texts = data.get("texts", [])
    scores = []
    for text in texts:
        blob = TextBlob(text)
        scores.append(blob.sentiment.polarity)
    return {"sentiment_scores": scores}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)