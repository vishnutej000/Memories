import pytest # type: ignore
from fastapi.testclient import TestClient # type: ignore
import os
import tempfile
from pathlib import Path

from src.main import app # type: ignore

client = TestClient(app)

def create_test_chat_file(content):
    """Create a temporary file with the given content."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        f.write(content)
        return f.name

@pytest.fixture
def sample_chat_file():
    """Create a sample chat file for testing."""
    content = """[18/05/2023, 08:39:07] John: Hello, how are you?
[18/05/2023, 08:40:15] Test User: I'm good, thanks!
[18/05/2023, 08:42:30] John: What are you doing today?
"""
    file_path = create_test_chat_file(content)
    yield file_path
    # Clean up
    os.unlink(file_path)

def test_root_endpoint():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "WhatsApp Memory Vault API is running" in response.json()["message"]

def test_health_endpoint():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_import_chat(sample_chat_file):
    """Test importing a chat file."""
    with open(sample_chat_file, "rb") as f:
        response = client.post(
            "/api/v1/chats/import",
            files={"file": ("chat.txt", f, "text/plain")},
            data={"user_name": "Test User"}
        )
    
    assert response.status_code == 200
    assert response.json()["count"] == 3
    assert len(response.json()["messages"]) == 3

def test_get_messages():
    """Test getting messages after import."""
    # First make sure we have messages
    with open(sample_chat_file, "rb") as f:
        client.post(
            "/api/v1/chats/import",
            files={"file": ("chat.txt", f, "text/plain")},
            data={"user_name": "Test User"}
        )
    
    # Now get the messages
    response = client.get("/api/v1/chats/messages")
    assert response.status_code == 200
    assert response.json()["count"] > 0

def test_search_messages():
    """Test searching messages."""
    # First make sure we have messages
    with open(sample_chat_file, "rb") as f:
        client.post(
            "/api/v1/chats/import",
            files={"file": ("chat.txt", f, "text/plain")},
            data={"user_name": "Test User"}
        )
    
    # Search for a specific term
    response = client.get("/api/v1/chats/search?q=good")
    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert "good" in response.json()["messages"][0]["content"].lower()

def test_get_statistics():
    """Test getting chat statistics."""
    # First make sure we have messages
    with open(sample_chat_file, "rb") as f:
        client.post(
            "/api/v1/chats/import",
            files={"file": ("chat.txt", f, "text/plain")},
            data={"user_name": "Test User"}
        )
    
    # Get statistics
    response = client.get("/api/v1/chats/statistics")
    assert response.status_code == 200
    assert response.json()["total_messages"] == 3
    assert len(response.json()["message_count_by_user"]) == 2

def test_export_json():
    """Test exporting chat as JSON."""
    # First make sure we have messages
    with open(sample_chat_file, "rb") as f:
        client.post(
            "/api/v1/chats/import",
            files={"file": ("chat.txt", f, "text/plain")},
            data={"user_name": "Test User"}
        )
    
    # Export as JSON
    response = client.get("/api/v1/export/json")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    assert response.headers["content-disposition"] == "attachment; filename=whatsapp_chat.json"