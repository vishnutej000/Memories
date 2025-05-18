#!/usr/bin/env python
"""
Run pre-start checks before starting the API server.
"""
import sys
import logging
from pathlib import Path
import subprocess
import importlib.util

def check_rust_module():
    """
    Check if Rust module is available and build it if needed.
    """
    try:
        # Using dynamic import to avoid static type checking errors
        whatsapp_parser = importlib.import_module("whatsapp_parser")
        logging.info("✅ Rust parser module is available")
        return True
    except ImportError:
        logging.warning("⚠️ Rust parser module not found, trying to build...")
        try:
            root_dir = Path(__file__).parent.parent
            build_script = root_dir / "scripts" / "build_rust.py"
            
            if build_script.exists():
                spec = importlib.util.spec_from_file_location("build_rust", build_script)
                build_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(build_module)
                build_module.main()
                return True
            else:
                logging.error("❌ Build script not found")
                return False
        except Exception as e:
            logging.error(f"❌ Failed to build Rust module: {e}")
            return False

def check_nltk_data():
    """
    Check if NLTK data is available and download if needed.
    """
    try:
        import nltk
        
        for resource in ["punkt", "stopwords", "vader_lexicon"]:
            try:
                nltk.data.find(f"tokenizers/{resource}" if resource == "punkt" else f"corpora/{resource}")
                logging.info(f"✅ NLTK {resource} is available")
            except LookupError:
                logging.warning(f"⚠️ NLTK {resource} not found, downloading...")
                nltk.download(resource)
        
        return True
    except Exception as e:
        logging.error(f"❌ NLTK data check failed: {e}")
        return False

def check_storage_directories():
    """
    Check if storage directories exist and create them if needed.
    """
    root_dir = Path(__file__).parent.parent
    storage_dir = root_dir / "storage"
    media_dir = storage_dir / "media"
    
    try:
        storage_dir.mkdir(exist_ok=True)
        media_dir.mkdir(exist_ok=True)
        logging.info("✅ Storage directories are ready")
        return True
    except Exception as e:
        logging.error(f"❌ Failed to create storage directories: {e}")
        return False

def main():
    """
    Run all pre-start checks.
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    logging.info("Running pre-start checks...")
    
    checks = [
        check_storage_directories,
        check_nltk_data,
        check_rust_module
    ]
    
    all_passed = all(check() for check in checks)
    
    if all_passed:
        logging.info("✅ All pre-start checks passed")
        sys.exit(0)
    else:
        logging.error("❌ Some pre-start checks failed")
        sys.exit(1)

if __name__ == "__main__":
    main()