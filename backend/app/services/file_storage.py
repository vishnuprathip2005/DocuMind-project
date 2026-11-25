import os
import uuid
from pathlib import Path
from typing import Tuple
from app.core.config import settings


def get_storage_path() -> Path:
    storage_dir = Path(settings.STORAGE_DIR).resolve()
    storage_dir.mkdir(parents=True, exist_ok=True)
    return storage_dir


def save_file(file_bytes: bytes, original_filename: str) -> Tuple[str, str]:
    """
    Saves file bytes securely into STORAGE_DIR using a UUID-generated filename.
    Returns (absolute_or_canonical_storage_path, generated_filename).
    """
    storage_dir = get_storage_path()
    
    # Extract file extension safely
    suffix = Path(original_filename).suffix.lower()
    # Generate unique storage filename
    storage_filename = f"{uuid.uuid4().hex}{suffix}"
    destination = storage_dir / storage_filename
    
    # Prevent directory traversal
    resolved_destination = destination.resolve()
    if not str(resolved_destination).startswith(str(storage_dir)):
        raise ValueError("Invalid storage destination path.")
    
    resolved_destination.write_bytes(file_bytes)
    return str(resolved_destination), storage_filename


def delete_file(storage_path_str: str) -> bool:
    """
    Removes the stored file from disk if it exists.
    """
    try:
        path = Path(storage_path_str).resolve()
        storage_dir = get_storage_path()
        # Security check: must reside inside storage_dir
        if not str(path).startswith(str(storage_dir)):
            return False
        if path.exists() and path.is_file():
            path.unlink()
            return True
    except Exception:
        pass
    return False


def verify_file_exists(storage_path_str: str) -> bool:
    """
    Checks if stored file exists and is accessible.
    """
    try:
        path = Path(storage_path_str).resolve()
        storage_dir = get_storage_path()
        if not str(path).startswith(str(storage_dir)):
            return False
        return path.exists() and path.is_file()
    except Exception:
        return False
