#!/usr/bin/env bash
# Render build script — runs on every deploy

set -o errexit  # Exit on error

# Install Python dependencies
pip install -r requirements.txt

# For a fresh database: create all tables via SQLAlchemy, then stamp Alembic
# For an existing database: just run Alembic migrations normally
python -c "
from backend.app.api.db_setup import engine, Base, init_db
from sqlalchemy import inspect

# Check if the database already has tables
inspector = inspect(engine)
tables = inspector.get_table_names()

if not tables:
    print('Fresh database detected — creating all tables via init_db()')
    init_db()
    print('Tables created successfully')
else:
    print(f'Existing database with {len(tables)} tables — skipping init_db()')
"

cd backend

# Stamp head if fresh DB (so Alembic knows all migrations are applied)
# Otherwise run migrations normally
python -c "
from sqlalchemy import inspect, create_engine
from app.api.settings import settings

database_url = settings.DATABASE_URL
if database_url.startswith('postgresql://'):
    database_url = database_url.replace('postgresql://', 'postgresql+psycopg://', 1)

engine = create_engine(database_url)
inspector = inspect(engine)

if 'alembic_version' not in inspector.get_table_names():
    print('No alembic_version table — stamping head')
    import subprocess
    subprocess.run(['alembic', 'stamp', 'head'], check=True)
else:
    print('alembic_version exists — running migrations')
    import subprocess
    subprocess.run(['alembic', 'upgrade', 'head'], check=True)
"

cd ..
