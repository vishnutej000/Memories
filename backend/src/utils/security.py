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