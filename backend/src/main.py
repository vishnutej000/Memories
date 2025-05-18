from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from datetime import datetime

from src.api.v1 import chats, export, audio
from src.utils.logger import setup_logger
from src.storage.local import ensure_storage_directory
from src.models.schemas import ErrorResponse

# Setup logging
logger = setup_logger()

# Initialize FastAPI app
app = FastAPI(
    title="WhatsApp Memory Vault API",
    description="Backend API for WhatsApp Memory Vault, a tool for analyzing and exploring WhatsApp chat exports.",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chats.router, prefix="/api/v1", tags=["Chats"])
app.include_router(export.router, prefix="/api/v1", tags=["Export"])
app.include_router(audio.router, prefix="/api/v1", tags=["Audio"])

@app.on_event("startup")
async def startup_event():
    """Initialize app on startup."""
    logger.info("Starting WhatsApp Memory Vault API")
    ensure_storage_directory()

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    logger.info("Shutting down WhatsApp Memory Vault API")

@app.get("/")
async def root():
    """Root endpoint for API health check."""
    return {
        "message": "WhatsApp Memory Vault API is running",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            message="An unexpected error occurred",
            details=str(exc) if str(exc) else None
        ).dict(),
    )

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)