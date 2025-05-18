import uvicorn # type: ignore

if __name__ == "__main__":
    # Run using uvicorn with import string
    uvicorn.run(
        "src.main:app",  # Use import string format "module:variable"
        host="0.0.0.0",  # Listen on all network interfaces
        port=8000,
        reload=True,     # Enable hot-reloading for development
    )