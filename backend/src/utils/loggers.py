import logging
import sys
import os
from datetime import datetime
from pathlib import Path

def setup_logger():
    """Set up the application logger."""
    # Create logs directory if it doesn't exist
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    # Configure logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Create log formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Add file handler
    log_filename = f"whatsapp_vault_{datetime.now().strftime('%Y%m%d')}.log"
    file_handler = logging.FileHandler(logs_dir / log_filename)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Add console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger