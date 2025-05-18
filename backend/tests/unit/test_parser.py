import pytest
import os
import tempfile
from datetime import datetime
from pathlib import Path

from core.parsing.adapter import parse_with_python

TEST_DATA_DIR = Path(__file__).parent.parent / "fixtures"

def create_test_chat_file(content):
    """Create a temporary file with the given content."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        f.write(content)
        return f.name

def test_parse_with_python_empty_file():
    """Test parsing an empty file."""
    file_path = create_test_chat_file("")
    try:
        messages = parse_with_python(file_path, "Test User")
        assert len(messages) == 0
    finally:
        os.unlink(file_path)

def test_parse_with_python_basic_messages():
    """Test parsing a file with basic messages."""
    content = """[18/05/2023, 08:39:07] John: Hello, how are you?
[18/05/2023, 08:40:15] Test User: I'm good, thanks!
[18/05/2023, 08:42:30] John: What are you doing today?
"""
    file_path = create_test_chat_file(content)
    try:
        messages = parse_with_python(file_path, "Test User")
        assert len(messages) == 3
        
        # Check first message
        assert messages[0].sender == "John"
        assert messages[0].content == "Hello, how are you?"
        assert messages[0].type == "text"
        assert messages[0].timestamp.day == 18
        assert messages[0].timestamp.month == 5
        assert messages[0].timestamp.year == 2023

        # Check own message
        assert messages[1].sender == "Test User"
        assert messages[1].content == "I'm good, thanks!"
    finally:
        os.unlink(file_path)

def test_parse_with_python_multiline_messages():
    """Test parsing a file with multi-line messages."""
    content = """[18/05/2023, 08:39:07] John: Hello
This is a multi-line
message from John
[18/05/2023, 08:40:15] Test User: My response
Also in multiple lines
"""
    file_path = create_test_chat_file(content)
    try:
        messages = parse_with_python(file_path, "Test User")
        assert len(messages) == 2
        
        # Check multi-line content
        assert messages[0].content == "Hello\nThis is a multi-line\nmessage from John"
        assert messages[1].content == "My response\nAlso in multiple lines"
    finally:
        os.unlink(file_path)

def test_parse_with_python_media_messages():
    """Test parsing a file with media messages."""
    content = """[18/05/2023, 08:39:07] John: <Media omitted>
[18/05/2023, 08:40:15] Test User: Check out this photo <Media omitted>
"""
    file_path = create_test_chat_file(content)
    try:
        messages = parse_with_python(file_path, "Test User")
        assert len(messages) == 2
        
        # Check media type detection
        assert messages[0].type == "file"  # Default for <Media omitted>
        assert messages[1].type == "image"  # Contains "photo" keyword
    finally:
        os.unlink(file_path)

def test_parse_with_python_invalid_format():
    """Test parsing a file with invalid format."""
    content = """This is not a WhatsApp chat export
Just some random text
"""
    file_path = create_test_chat_file(content)
    try:
        messages = parse_with_python(file_path, "Test User")
        assert len(messages) == 0
    finally:
        os.unlink(file_path)