"""
Authentication and Password Hashing Module for Smart Parking Management System.
Uses SHA-256 for secure password storage.
"""

import hashlib
from typing import Optional, Dict, Any


def hash_password(password: str) -> str:
    """Hash a plaintext password using SHA-256."""
    if not password:
        return ""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Verify if a plaintext password matches a SHA-256 hash."""
    if not password or not hashed:
        return False
    return hash_password(password) == hashed


class UserSession:
    """Singleton tracking current logged-in user session and roles."""
    _current_user: Optional[Dict[str, Any]] = None

    @classmethod
    def set_user(cls, user_data: Dict[str, Any]):
        cls._current_user = user_data

    @classmethod
    def clear(cls):
        cls._current_user = None

    @classmethod
    def get_user(cls) -> Optional[Dict[str, Any]]:
        return cls._current_user

    @classmethod
    def is_logged_in(cls) -> bool:
        return cls._current_user is not None

    @classmethod
    def is_admin(cls) -> bool:
        if not cls._current_user:
            return False
        return cls._current_user.get("role") == "admin"

    @classmethod
    def get_username(cls) -> str:
        if not cls._current_user:
            return "Guest"
        return cls._current_user.get("username", "Unknown")

    @classmethod
    def get_role(cls) -> str:
        if not cls._current_user:
            return "None"
        return cls._current_user.get("role", "attendant").capitalize()

    @classmethod
    def get_full_name(cls) -> str:
        if not cls._current_user:
            return "Guest"
        return cls._current_user.get("full_name", cls.get_username())

