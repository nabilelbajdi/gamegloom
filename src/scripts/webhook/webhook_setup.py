import sys
import os
import json
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

import requests
from backend.app.api.settings import settings

BASE_URL = "https://api.gamegloom.com/api/v1/webhooks/igdb"

# IGDB API endpoints
REGISTER_URL = "https://api.igdb.com/v4/games/webhooks/"
LIST_URL = "https://api.igdb.com/v4/webhooks/"
DELETE_URL = "https://api.igdb.com/v4/webhooks/"
TEST_URL = "https://api.igdb.com/v4/games/webhooks/test/"

HEADERS = {
    "Client-ID": settings.IGDB_CLIENT_ID,
    "Authorization": f"Bearer {settings.IGDB_ACCESS_TOKEN}",
    "Content-Type": "application/x-www-form-urlencoded"
}

def register_webhook(method, debug=False):
    """Register a webhook for create, update, or delete"""
    data = {
        "url": f"{BASE_URL}/{method}",
        "secret": settings.IGDB_WEBHOOK_SECRET,
        "method": method
    }
    
    if debug:
        print(f"Registering {method} webhook to {data['url']}")
    
    try:
        response = requests.post(
            REGISTER_URL,
            headers=HEADERS,
            data=data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Registered {method} webhook (ID: {result[0]['id']})")
            return result[0] if result else None
        else:
            print(f"✗ Failed to register {method} webhook: {response.status_code}")
            if debug:
                print(f"Error: {response.text}")
    
    except Exception as e:
        print(f"✗ Error: {str(e)}")

def list_webhooks(debug=False):
    """List all registered webhooks"""
    try:
        response = requests.get(
            LIST_URL,
            headers=HEADERS
        )
        
        if response.status_code == 200:
            try:
                webhooks = response.json()
                print(f"Found {len(webhooks)} registered webhooks:")
                
                if webhooks:
                    for i, hook in enumerate(webhooks):
                        active = "✓" if hook.get('active') else "✗"
                        print(f"  {i+1}. {active} ID: {hook.get('id')}, URL: {hook.get('url')}")
                        if debug:
                            print(f"     Method: {hook.get('method', hook.get('sub_category'))}")
                            print(f"     Created: {hook.get('created_at')}")
                else:
                    print("  No webhooks are currently registered")
                    
                return webhooks
            except:
                print("✗ Error parsing response")
                return []
        else:
            print(f"✗ Failed to list webhooks: {response.status_code}")
            return []
    
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return []

def delete_webhook(webhook_id, debug=False):
    """Delete a webhook by ID"""
    if webhook_id is None:
        print("✗ Cannot delete webhook with ID 'None'")
        return False
    
    try:
        response = requests.delete(
            f"{DELETE_URL}{webhook_id}",
            headers=HEADERS
        )
        
        if response.status_code in [200, 204]:
            print(f"✓ Deleted webhook {webhook_id}")
            return True
        else:
            print(f"✗ Failed to delete webhook {webhook_id}: {response.status_code}")
            return False
    
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

def test_webhook(webhook_id, entity_id, debug=False):
    """Test a webhook by sending a test payload"""
    if webhook_id is None:
        print("✗ Cannot test webhook with ID 'None'")
        return False
    
    test_url = f"{TEST_URL}{webhook_id}?entityId={entity_id}"
    
    if debug:
        print(f"Testing webhook {webhook_id} with entity {entity_id}")
    
    try:
        response = requests.post(
            test_url,
            headers=HEADERS
        )
        
        if response.status_code == 200:
            print(f"✓ Test sent to webhook {webhook_id} with game {entity_id}")
            return True
        else:
            print(f"✗ Test failed: {response.status_code}")
            return False
    
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

def setup_webhooks(debug=False):
    """Register all webhook types"""
    print("\n--- Setting up IGDB webhooks ---")
    webhook_ids = []
    
    for method in ["create", "update", "delete"]:
        result = register_webhook(method, debug=debug)
        if result and 'id' in result:
            webhook_ids.append((result['id'], method))
    
    print("\nWebhook setup complete!")
    
    if webhook_ids:
        print("\nTo test these webhooks, run:")
        for webhook_id, method in webhook_ids:
            print(f"python scripts/webhook/webhook_setup.py test {webhook_id} --entity 1942")
    
    return webhook_ids

def cleanup_webhooks(debug=False):
    """Delete all registered webhooks"""
    print("\n--- Cleaning up IGDB webhooks ---")
    webhooks = list_webhooks(debug=debug)
    
    if not webhooks:
        print("No webhooks to delete")
        return
        
    success_count = 0
    for webhook in webhooks:
        webhook_id = webhook.get('id')
        if webhook_id and delete_webhook(webhook_id, debug=debug):
            success_count += 1
    
    print(f"\nDeleted {success_count} out of {len(webhooks)} webhooks")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="IGDB Webhook Management")
    parser.add_argument('action', choices=['setup', 'list', 'cleanup', 'test'], 
                        help='Action to perform: setup, list, cleanup, or test')
    parser.add_argument('webhook_id', nargs='?', help='Webhook ID (required for test action)')
    parser.add_argument('--entity', type=int, default=1942, help='Entity ID to use for testing (default: 1942)')
    parser.add_argument('--debug', action='store_true', help='Show debugging information')
    
    args = parser.parse_args()
    
    if args.action == 'setup':
        setup_webhooks(debug=args.debug)
    elif args.action == 'list':
        list_webhooks(debug=args.debug)
    elif args.action == 'cleanup':
        cleanup_webhooks(debug=args.debug)
    elif args.action == 'test':
        if not args.webhook_id:
            print("Error: webhook_id is required for test action")
            sys.exit(1)
        test_webhook(args.webhook_id, args.entity, debug=args.debug) 