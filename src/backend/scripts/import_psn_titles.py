# scripts/import_psn_titles.py
"""
Import PlayStation Titles data from andshrew's GitHub repository.

Usage:
    cd backend && python -m scripts.import_psn_titles

Data source: https://github.com/andshrew/PlayStation-Titles
"""
import csv
import os
import sys

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.api.db_setup import SessionLocal, engine, Base
from app.api.v1.models.psn_title_lookup import PsnTitleLookup


def import_titles(tsv_path: str = "data/All_Titles.tsv"):
    """
    Import PlayStation titles from TSV file into database.
    
    Args:
        tsv_path: Path to the All_Titles.tsv file
    """
    # Create table if it doesn't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check current count
        existing_count = db.query(PsnTitleLookup).count()
        print(f"[Import] Existing records: {existing_count}")
        
        # If table already populated, ask for confirmation
        if existing_count > 0:
            print(f"[Import] Table already has {existing_count} records")
            response = input("Clear and reimport? (y/N): ").strip().lower()
            if response != 'y':
                print("[Import] Aborted")
                return
            
            # Clear existing data
            db.query(PsnTitleLookup).delete()
            db.commit()
            print("[Import] Cleared existing data")
        
        # Read TSV file
        if not os.path.exists(tsv_path):
            print(f"[Import] File not found: {tsv_path}")
            print("[Import] Download it first:")
            print(f'  curl -L -o {tsv_path} "https://raw.githubusercontent.com/andshrew/PlayStation-Titles/main/All_Titles.tsv"')
            return
        
        records = []
        with open(tsv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter='\t')
            
            for row in reader:
                title_id = row.get('titleId', '').strip()
                concept_id_str = row.get('conceptId', '').strip()
                name = row.get('name', '').strip()
                region = row.get('region', '').strip()
                
                if not title_id or not name:
                    continue
                
                # Parse concept_id as integer (may be empty)
                concept_id = None
                if concept_id_str:
                    try:
                        concept_id = int(concept_id_str)
                    except ValueError:
                        pass
                
                records.append(PsnTitleLookup(
                    title_id=title_id,
                    concept_id=concept_id,
                    name=name,
                    region=region or None
                ))
                
                # Batch insert every 5000 records
                if len(records) >= 5000:
                    db.bulk_save_objects(records)
                    db.commit()
                    print(f"[Import] Inserted {len(records)} records...")
                    records = []
        
        # Insert remaining records
        if records:
            db.bulk_save_objects(records)
            db.commit()
            print(f"[Import] Inserted {len(records)} records...")
        
        # Final count
        final_count = db.query(PsnTitleLookup).count()
        print(f"[Import] Complete! Total records: {final_count}")
        
        # Show sample lookups
        print("\n[Import] Sample lookups:")
        samples = [
            "CUSA00634_00",  # Star Wars Battlefront 2015
            "PPSA21669_00",  # Marvel Rivals
            "CUSA02328_00",  # Smite
        ]
        for tid in samples:
            lookup = db.query(PsnTitleLookup).filter(PsnTitleLookup.title_id == tid).first()
            if lookup:
                print(f"  {tid} → concept_id={lookup.concept_id}, name='{lookup.name}'")
            else:
                print(f"  {tid} → not found")
        
    finally:
        db.close()


if __name__ == "__main__":
    # Find the TSV file relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(script_dir)
    tsv_path = os.path.join(backend_dir, "data", "All_Titles.tsv")
    
    print(f"[Import] Loading from: {tsv_path}")
    import_titles(tsv_path)
