import os
import base64
import hashlib
from cryptography.fernet import Fernet # type: ignore
import logging
from datetime import datetime, timedelta
import jwt # type: ignore
from passlib.context import CryptContext # type: ignore

logger = logging.getLogger(__name__)

# Generate a secret key or load from environment variable
SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    # Generate a new key if not available
    SECRET_KEY = base64.urlsafe_b64encode(os.urandom(32)).decode()
    logger.warning("Generated new SECRET_KEY. It's recommended to set this in environment variables.")

# Initialize encryption
FERNET_KEY = base64.urlsafe_b64encode(hashlib.sha256(SECRET_KEY.encode()).digest())
cipher_suite = Fernet(FERNET_KEY)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET", SECRET_KEY)
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DELTA = timedelta(days=7)  # Token valid for 7 days

def encrypt_text(text: str) -> str:
    """
    Encrypt a string using Fernet symmetric encryption.
    
    Args:
        text: Text to encrypt
    
    Returns:
        str: Encrypted text as base64 string
    """
    encrypted_data = cipher_suite.encrypt(text.encode())
    return base64.urlsafe_b64encode(encrypted_data).decode()

def decrypt_text(encrypted_text: str) -> str:
    """
    Decrypt a string that was encrypted with encrypt_text.
    
    Args:
        encrypted_text: Base64-encoded encrypted text
    
    Returns:
        str: Decrypted text
    """
    try:
        decoded_data = base64.urlsafe_b64decode(encrypted_text)
        decrypted_data = cipher_suite.decrypt(decoded_data)
        return decrypted_data.decode()
    except Exception as e:
        logger.error(f"Error decrypting text: {e}")
        return ""

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Password to hash
    
    Returns:
        str: Hashed password
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password to check against
    
    Returns:
        bool: True if password matches hash
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Data to encode in the token
    
    Returns:
        str: JWT token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + JWT_EXPIRATION_DELTA
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """
    Decode a JWT access token.
    
    Args:
        token: JWT token to decode
    
    Returns:
        dict: Decoded token data or None if invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError as e:
        logger.error(f"Error decoding JWT token: {e}")
        return None

def generate_random_token(length: int = 32) -> str:
    """
    Generate a random token.
    
    Args:
        length: Length of the token in bytes
    
    Returns:
        str: Random token as hexadecimal string
    """
    return os.urandom(length).hex()

def compute_file_hash(file_data: bytes) -> str:
    """
    Compute SHA-256 hash of file data.
    
    Args:
        file_data: File content as bytes
    
    Returns:
        str: Hexadecimal hash
    """
    return hashlib.sha256(file_data).hexdigest()

# Security Middleware
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
import time
import re

class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Security middleware to add security headers and validate requests
    """
    
    def __init__(self, app: FastAPI, **kwargs):
        super().__init__(app, **kwargs)
        self.blocked_ips = set()
        self.suspicious_patterns = [
            r'<script[^>]*>.*?</script>',  # XSS attempts
            r'union\s+select',  # SQL injection
            r'\.\./',  # Path traversal
            r'eval\s*\(',  # Code injection
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Check if IP is blocked
        client_ip = request.client.host if request.client else "unknown"
        if client_ip in self.blocked_ips:
            return JSONResponse(
                status_code=403,
                content={"detail": "Access denied"}
            )
        
        # Check for suspicious patterns in URL and headers
        if self._contains_suspicious_content(str(request.url)):
            logger.warning(f"Suspicious URL pattern detected from {client_ip}: {request.url}")
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid request"}
            )
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; "
            "connect-src 'self' http://localhost:* http://127.0.0.1:*"
        )
        
        return response
    
    def _contains_suspicious_content(self, content: str) -> bool:
        """Check if content contains suspicious patterns"""
        content_lower = content.lower()
        for pattern in self.suspicious_patterns:
            if re.search(pattern, content_lower, re.IGNORECASE):
                return True
        return False


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware to prevent abuse
    """
    
    def __init__(self, app: FastAPI, calls: int = 100, period: int = 60, **kwargs):
        super().__init__(app, **kwargs)
        self.calls = calls  # Number of calls allowed
        self.period = period  # Time period in seconds
        self.clients = defaultdict(list)  # Store client request timestamps
        
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Clean old entries
        self.clients[client_ip] = [
            timestamp for timestamp in self.clients[client_ip]
            if now - timestamp < self.period
        ]
        
        # Check rate limit
        if len(self.clients[client_ip]) >= self.calls:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests",
                    "retry_after": self.period
                },
                headers={"Retry-After": str(self.period)}
            )
        
        # Add current request timestamp
        self.clients[client_ip].append(now)
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = max(0, self.calls - len(self.clients[client_ip]))
        response.headers["X-RateLimit-Limit"] = str(self.calls)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(now + self.period))
        
        return response


# Input validation and sanitization functions
def sanitize_input(data: str) -> str:
    """
    Sanitize input string to prevent XSS and injection attacks
    
    Args:
        data: Input string to sanitize
    
    Returns:
        str: Sanitized string
    """
    if not isinstance(data, str):
        return str(data)
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', '\x00', '\r', '\n']
    sanitized = data
    
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')
    
    # Limit length
    return sanitized[:1000] if len(sanitized) > 1000 else sanitized


def validate_file_type(filename: str, allowed_extensions: list) -> bool:
    """
    Validate if file type is allowed
    
    Args:
        filename: Name of the file
        allowed_extensions: List of allowed file extensions
    
    Returns:
        bool: True if file type is allowed
    """
    if not filename or '.' not in filename:
        return False
    
    extension = filename.lower().split('.')[-1]
    return extension in [ext.lower() for ext in allowed_extensions]


def validate_file_size(file_size: int, max_size_mb: int = 50) -> bool:
    """
    Validate file size
    
    Args:
        file_size: Size of file in bytes
        max_size_mb: Maximum allowed size in megabytes
    
    Returns:
        bool: True if file size is acceptable
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    return file_size <= max_size_bytes


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks
    
    Args:
        filename: Original filename
    
    Returns:
        str: Sanitized filename
    """
    # Remove path components
    filename = os.path.basename(filename)
    
    # Remove dangerous characters
    dangerous_chars = ['/', '\\', '..', ':', '*', '?', '"', '<', '>', '|']
    for char in dangerous_chars:
        filename = filename.replace(char, '_')
    
    # Ensure filename is not empty and not too long
    if not filename or filename.startswith('.'):
        filename = f"file_{generate_random_token(8)}"
    
    return filename[:100] if len(filename) > 100 else filename

def validate_file_upload(filename: str, content_type: str = None, max_size_mb: int = 50) -> bool:
    """
    Validate uploaded file for security and format compliance
    
    Args:
        filename: Name of the uploaded file
        content_type: MIME type of the file
        max_size_mb: Maximum allowed file size in MB
    
    Returns:
        bool: True if file is valid, False otherwise
    """
    if not filename:
        return False
    
    # Check file extension
    allowed_extensions = {'.txt', '.zip'}
    file_ext = filename.lower().split('.')[-1]
    if f'.{file_ext}' not in allowed_extensions:
        return False
    
    # Check content type if provided
    if content_type:
        allowed_content_types = {'text/plain', 'application/zip', 'application/x-zip-compressed'}
        if content_type not in allowed_content_types:
            return False
    
    return True