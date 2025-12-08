#!/usr/bin/env python3
"""
Cleanup script to mark low-quality games as deleted.

This script identifies games that don't meet quality requirements:
- No cover image
- No summary or storyline
- Game types: Mod (5), Pack (13), Update (14)

Usage:
    python cleanup_low_quality_games.py          # Dry run (just report)
    python cleanup_low_quality_games.py --apply  # Actually mark games as deleted
"""

import sys
import argparse
from pathlib import Path

# Add the src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.app.api.db_setup import SessionLocal
from backend.app.api.v1.models.game import Game
from sqlalchemy import or_

# Game types to exclude
EXCLUDED_GAME_TYPES = {5, 13, 14}  # Mod, Pack, Update


def find_low_quality_games(db):
    """Find all games that don't meet quality requirements."""
    
    # Games with excluded types
    excluded_types = db.query(Game).filter(
        Game.game_type_id.in_(EXCLUDED_GAME_TYPES),
        Game.is_deleted == False
    ).all()
    
    # Games without cover
    no_cover = db.query(Game).filter(
        or_(Game.cover_image.is_(None), Game.cover_image == ''),
        Game.is_deleted == False
    ).all()
    
    # Games without summary or storyline
    no_description = db.query(Game).filter(
        or_(Game.summary.is_(None), Game.summary == ''),
        or_(Game.storyline.is_(None), Game.storyline == ''),
        Game.is_deleted == False
    ).all()
    
    # Combine all (unique)
    all_ids = set()
    all_games = []
    
    for game in excluded_types + no_cover + no_description:
        if game.id not in all_ids:
            all_ids.add(game.id)
            all_games.append(game)
    
    return {
        "excluded_types": excluded_types,
        "no_cover": no_cover,
        "no_description": no_description,
        "all": all_games
    }


def main():
    parser = argparse.ArgumentParser(description="Cleanup low-quality games")
    parser.add_argument("--apply", action="store_true", help="Actually mark games as deleted")
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        print("Scanning for low-quality games...")
        results = find_low_quality_games(db)
        
        print(f"\n=== LOW QUALITY GAMES FOUND ===")
        print(f"  Excluded types (Mod/Pack/Update): {len(results['excluded_types'])}")
        print(f"  No cover image:                   {len(results['no_cover'])}")
        print(f"  No summary/storyline:             {len(results['no_description'])}")
        print(f"  --------------------------------")
        print(f"  Total unique games:               {len(results['all'])}")
        
        if not results['all']:
            print("\n✅ No low-quality games found!")
            return
        
        if args.apply:
            print(f"\nMarking {len(results['all'])} games as deleted...")
            for game in results['all']:
                game.is_deleted = True
            db.commit()
            print("✅ Done! Games marked as is_deleted=True")
            print("   They won't appear in search/browse but data is preserved.")
        else:
            print("\n📋 DRY RUN - No changes made")
            print("   Run with --apply to mark these games as deleted")
            
            # Show sample of games to be affected
            print("\nSample games that would be affected:")
            for game in results['all'][:10]:
                reasons = []
                if game.game_type_id in EXCLUDED_GAME_TYPES:
                    reasons.append(f"type={game.game_type_name}")
                if not game.cover_image:
                    reasons.append("no cover")
                if not game.summary and not game.storyline:
                    reasons.append("no description")
                print(f"  - {game.name} ({', '.join(reasons)})")
            
            if len(results['all']) > 10:
                print(f"  ... and {len(results['all']) - 10} more")
    
    finally:
        db.close()


if __name__ == "__main__":
    main()
