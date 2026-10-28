"""
Configuration settings for Smart Parking Management System.
Allows overriding database connection parameters via config file or environment variables.
"""

import os
import json

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db_config.json")

# Defaults
DEFAULT_DB_HOST = "localhost"
DEFAULT_DB_PORT = 3306
DEFAULT_DB_USER = "root"
DEFAULT_DB_PASSWORD = "1234"
DEFAULT_DB_NAME = "smart_parking_db"


def load_db_config():
    """Load database credentials from JSON file, environment, or defaults."""
    cfg = {
        "host": DEFAULT_DB_HOST,
        "port": DEFAULT_DB_PORT,
        "user": DEFAULT_DB_USER,
        "password": DEFAULT_DB_PASSWORD,
        "database": DEFAULT_DB_NAME
    }

    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                cfg.update(saved)
        except Exception:
            pass

    # Environment overrides
    if "SPMS_DB_HOST" in os.environ:
        cfg["host"] = os.environ["SPMS_DB_HOST"]
    if "SPMS_DB_PORT" in os.environ:
        cfg["port"] = int(os.environ["SPMS_DB_PORT"])
    if "SPMS_DB_USER" in os.environ:
        cfg["user"] = os.environ["SPMS_DB_USER"]
    if "SPMS_DB_PASSWORD" in os.environ:
        cfg["password"] = os.environ["SPMS_DB_PASSWORD"]
    if "SPMS_DB_NAME" in os.environ:
        cfg["database"] = os.environ["SPMS_DB_NAME"]

    return cfg


def save_db_config(host, port, user, password, database):
    """Save updated database credentials to db_config.json and update globals."""
    global DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
    data = {
        "host": str(host).strip(),
        "port": int(port),
        "user": str(user).strip(),
        "password": str(password),
        "database": str(database).strip()
    }
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

    DB_HOST = data["host"]
    DB_PORT = data["port"]
    DB_USER = data["user"]
    DB_PASSWORD = data["password"]
    DB_NAME = data["database"]


# Initialize active globals
_active_cfg = load_db_config()
DB_HOST = _active_cfg["host"]
DB_PORT = _active_cfg["port"]
DB_USER = _active_cfg["user"]
DB_PASSWORD = _active_cfg["password"]
DB_NAME = _active_cfg["database"]

# Theme & Palette Settings for GUI
THEME_PRIMARY = "#1e293b"      # Slate Navy 800
THEME_SECONDARY = "#0f172a"    # Slate Navy 900
THEME_ACCENT = "#2563eb"       # Royal Blue
THEME_ACCENT_HOVER = "#1d4ed8"
THEME_SUCCESS = "#16a34a"      # Green (Available)
THEME_DANGER = "#dc2626"       # Red (Occupied)
THEME_WARNING = "#ea580c"      # Orange (Reserved)
THEME_MUTED = "#64748b"        # Gray (Maintenance)
THEME_BG = "#f8fafc"           # Light Slate 50
THEME_CARD_BG = "#ffffff"      # White
THEME_TEXT = "#0f172a"
THEME_SUBTEXT = "#64748b"

FONT_FAMILY = "Segoe UI"
