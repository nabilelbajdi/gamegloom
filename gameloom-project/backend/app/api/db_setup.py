from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .settings import settings

# Create database engine
engine = create_engine(settings.DATABASE_URL, echo=True)

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
