#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Set environment variables (optional - will use SQLite if not set)
# export DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/transfer_db"

# Run the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
