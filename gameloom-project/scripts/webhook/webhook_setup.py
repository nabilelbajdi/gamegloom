import sys
import os
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

import requests
from backend.app.api.settings import settings

# Replace URL with actual URL when deploying
BASE_URL = "https://your-api-domain.com/api/v1/webhooks/igdb"

HEADERS = {
    "Client-ID": settings.IGDB_CLIENT_ID,
    "Authorization": f"Bearer {settings.IGDB_ACCESS_TOKEN}",
    "Content-Type": "application/x-www-form-urlencoded"
}

def register_webhook(method):
    """Register a webhook for create, update, or delete"""
    if BASE_URL == "https://your-api-domain.com/api/v1/webhooks/igdb":
        print("Update BASE_URL with actual API domain before running this script")
        sys.exit(1)
        
    data = {
        "url": f"{BASE_URL}/{method}",
        "secret": settings.IGDB_WEBHOOK_SECRET,
        "method": method
    }
    response = requests.post(
        "https://api.igdb.com/v4/games/webhooks/",
        headers=HEADERS,
        data=data
    )
    print(f"Webhook Registration Response for {method}: {response.json()}")

def setup_webhooks():
    """Register all webhook types"""
    for method in ["create", "update", "delete"]:
        register_webhook(method)

if __name__ == "__main__":
    setup_webhooks() 