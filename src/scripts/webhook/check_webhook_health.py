#!/usr/bin/env python
"""
Check IGDB webhook health and optionally re-register if needed.

Usage:
    # Check webhook status
    python scripts/webhook/check_webhook_health.py
    
    # Check and auto-fix if needed
    python scripts/webhook/check_webhook_health.py --auto-fix
"""
import os
import sys
import argparse
from datetime import datetime
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))

import requests
from backend.app.api.settings import settings

LIST_URL = "https://api.igdb.com/v4/webhooks/"
REGISTER_URL = "https://api.igdb.com/v4/games/webhooks/"
BASE_URL = "https://api.gamegloom.com/api/v1/webhooks/igdb"

HEADERS = {
    "Client-ID": settings.IGDB_CLIENT_ID,
    "Authorization": f"Bearer {settings.IGDB_ACCESS_TOKEN}",
}

REQUIRED_WEBHOOKS = ["create", "update", "delete"]


def get_registered_webhooks():
    """Get list of currently registered webhooks."""
    try:
        response = requests.get(LIST_URL, headers=HEADERS)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching webhooks: {e}")
        return []


def register_webhook(method):
    """Register a single webhook."""
    data = {
        "url": f"{BASE_URL}/{method}",
        "secret": settings.IGDB_WEBHOOK_SECRET,
        "method": method
    }
    
    try:
        response = requests.post(
            REGISTER_URL,
            headers={**HEADERS, "Content-Type": "application/x-www-form-urlencoded"},
            data=data
        )
        return response.status_code == 200
    except:
        return False


def check_health(auto_fix=False):
    """Check webhook health and optionally fix issues."""
    print("\n" + "=" * 50)
    print("IGDB WEBHOOK HEALTH CHECK")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    webhooks = get_registered_webhooks()
    
    if not webhooks:
        print("\n⚠️  NO WEBHOOKS REGISTERED!")
        print("   Games will NOT update automatically from IGDB.")
        
        if auto_fix:
            print("\n   Auto-fixing...")
            for method in REQUIRED_WEBHOOKS:
                if register_webhook(method):
                    print(f"   ✓ Registered {method} webhook")
                else:
                    print(f"   ✗ Failed to register {method} webhook")
        else:
            print("\n   Run with --auto-fix to register webhooks automatically.")
            print("   Or run: python scripts/webhook/webhook_setup.py setup")
        
        return False
    
    # Check each required webhook
    registered_methods = set()
    print(f"\nFound {len(webhooks)} webhooks:")
    
    for hook in webhooks:
        url = hook.get('url', '')
        active = hook.get('active', False)
        hook_id = hook.get('id', 'unknown')
        
        # Extract method from URL
        method = url.split('/')[-1] if url else 'unknown'
        registered_methods.add(method)
        
        status = "✓" if active else "✗ INACTIVE"
        print(f"   {status} {method} (ID: {hook_id})")
    
    # Check for missing webhooks
    missing = set(REQUIRED_WEBHOOKS) - registered_methods
    if missing:
        print(f"\n⚠️  Missing webhooks: {', '.join(missing)}")
        
        if auto_fix:
            print("   Auto-fixing...")
            for method in missing:
                if register_webhook(method):
                    print(f"   ✓ Registered {method} webhook")
                else:
                    print(f"   ✗ Failed to register {method} webhook")
        else:
            print("   Run with --auto-fix to register missing webhooks.")
        
        return False
    
    print("\n✓ All webhooks healthy!")
    print("=" * 50)
    return True


def main():
    parser = argparse.ArgumentParser(description="Check IGDB webhook health")
    parser.add_argument('--auto-fix', action='store_true', help='Automatically fix issues')
    args = parser.parse_args()
    
    healthy = check_health(auto_fix=args.auto_fix)
    sys.exit(0 if healthy else 1)


if __name__ == "__main__":
    main()
