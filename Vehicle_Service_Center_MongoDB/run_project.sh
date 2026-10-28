#!/usr/bin/env bash
# =====================================================================
# Vehicle Service Center - MongoDB DBMS Project Launcher
# =====================================================================

set -e
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=========================================================="
echo "   🔧 Vehicle Service Center - MongoDB DBMS Project"
echo "=========================================================="

# 1. Check if mongod is running
if ! nc -z localhost 27017 2>/dev/null && ! mongosh --eval "db.version()" --norc >/dev/null 2>&1; then
    echo "[!] MongoDB does not appear to be running on port 27017."
    echo "    Attempting to start MongoDB service..."
    if command -v brew >/dev/null 2>&1; then
        brew services start mongodb-community || true
    fi
    sleep 2
fi

# 2. Check Python Environment
PYTHON_CMD="python3"
if [ ! -d "venv" ]; then
    echo "[*] Creating Python virtual environment in ./venv..."
    $PYTHON_CMD -m venv venv || true
fi

if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    PYTHON_CMD="python"
fi

# 3. Check and install dependencies
if ! $PYTHON_CMD -c "import pymongo, streamlit, pandas" 2>/dev/null; then
    echo "[*] Installing required packages (pymongo, streamlit, pandas)..."
    pip install -r requirements.txt || pip3 install -r requirements.txt
fi

echo ""
echo "Select how you would like to run the project:"
echo " 1) 🚀 Run Full DBMS Concepts Demo (CLI Output)"
echo " 2) 💻 Run Interactive CLI Application"
echo " 3) 🌐 Launch Streamlit Web UI (Browser)"
echo " 4) 📜 Run MongoDB Shell Script (mongosh setup & queries)"
echo " 0) Exit"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        $PYTHON_CMD service_center_mongo.py --demo
        ;;
    2)
        $PYTHON_CMD service_center_mongo.py
        ;;
    3)
        echo "[*] Launching Streamlit web interface..."
        streamlit run app.py
        ;;
    4)
        if command -v mongosh >/dev/null 2>&1; then
            mongosh mongodb://localhost:27017/service_center mongo_setup.js
        else
            echo "[!] mongosh not found in PATH."
        fi
        ;;
    0)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid choice."
        exit 1
        ;;
esac
