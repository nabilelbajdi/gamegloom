from app.api.v1.core.models import Base
from app.settings import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# echo = True to see the SQL queries
engine = create_engine(settings.DB_URL, echo=True)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    with Session(engine, expire_on_commit=False) as session:
        yield session 