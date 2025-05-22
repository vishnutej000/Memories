# Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-05-19 07:58:51
# Current User's Login: vishnutej000

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging
from typing import Dict, Any, List

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("memories-api")

# Import your existing routers
from src.api.v1.chats import router as chats_router
from src.api.v1.export import router as export_router
from src.api.v1.audio import router as audio_router

app = FastAPI(
    title="Memories API", 
    version="1.0.0",
    description="API for managing and analyzing WhatsApp chat exports",
)

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# Add a temporary chats endpoint if your router doesn't have one yet
@app.get("/api/v1/chats", tags=["Temporary"])
async def get_chats_temp() -> List[Dict[str, Any]]:
    """
    Temporary endpoint to provide sample chat data.
    This can be removed once your actual chats router is fully implemented.
    """
    logger.info("Serving temporary chat data")
    
    # Return mock data
    return [
        {
            "id": "chat1",
            "title": "Family Group",
            "is_group_chat": True,
            "filename": "Family Group.txt",
            "participants": ["Mom", "Dad", "You", "Sister"],
            "message_count": 1243,
            "date_range": {
                "start": "2024-01-01T00:00:00Z",
                "end": "2025-05-01T00:00:00Z"
            },
            "first_message_date": "2024-01-01T00:00:00Z",
            "last_message_date": "2025-05-01T00:00:00Z"
        },
        {
            "id": "chat2",
            "title": "Work Project",
            "is_group_chat": True,
            "filename": "Work Project.txt",
            "participants": ["Boss", "Colleague1", "You", "Colleague2"],
            "message_count": 856,
            "date_range": {
                "start": "2024-03-15T00:00:00Z",
                "end": "2025-04-30T00:00:00Z"
            },
            "first_message_date": "2024-03-15T00:00:00Z",
            "last_message_date": "2025-04-30T00:00:00Z"
        },
        {
            "id": "chat3",
            "title": "Best Friend",
            "is_group_chat": False,
            "filename": "BestFriend.txt",
            "participants": ["Best Friend", "You"],
            "message_count": 2765,
            "date_range": {
                "start": "2023-11-20T00:00:00Z",
                "end": "2025-05-10T00:00:00Z"
            },
            "first_message_date": "2023-11-20T00:00:00Z", 
            "last_message_date": "2025-05-10T00:00:00Z"
        }
    ]

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)