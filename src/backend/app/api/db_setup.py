# db_setup.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .settings import settings

# Create database engine
# Convert postgresql:// to postgresql+psycopg:// for psycopg3 compatibility
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(database_url, echo=True)

# Base class for models
class Base(DeclarativeBase):
    pass

# Session factory
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

# Initialize database tables
def init_db():
    Base.metadata.create_all(bind=engine)

# Dependency for getting a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
