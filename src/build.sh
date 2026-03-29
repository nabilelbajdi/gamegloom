#!/usr/bin/env bash
# Render build script — runs on every deploy

set -o errexit  # Exit on error

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
cd backend
alembic upgrade head
cd ..
