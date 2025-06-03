#!/usr/bin/env python3
"""
Simple server startup script to avoid Windows/uvicorn issues
"""

from src.main import app
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting WhatsApp Memory Vault API server...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")
    uvicorn.run(
        app,
        host="localhost",
        port=8000,
        log_level="info",
        access_log=True,
        reload=False  # Disable reload to avoid Windows multiprocessing issues
    )
