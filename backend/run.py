import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.abspath('.'))

# Import and run the app
from src.main import app
import uvicorn

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)