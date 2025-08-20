#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Run the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
