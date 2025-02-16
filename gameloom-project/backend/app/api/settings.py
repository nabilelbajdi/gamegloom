# settings.py
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:idk135@localhost:5432/gameloom_db")
    
    # IGDB settings
    IGDB_CLIENT_ID: str = os.getenv("IGDB_CLIENT_ID", "")
    IGDB_ACCESS_TOKEN: str = os.getenv("IGDB_ACCESS_TOKEN", "")
    IGDB_URL: str = "https://api.igdb.com/v4/games"
    IGDB_TIME_TO_BEAT_URL: str = "https://api.igdb.com/v4/game_time_to_beats"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields

    def validate(self):
        if not self.IGDB_CLIENT_ID:
            raise ValueError("IGDB_CLIENT_ID must be set in environment variables")
        if not self.IGDB_ACCESS_TOKEN:
            raise ValueError("IGDB_ACCESS_TOKEN must be set in environment variables")
        return self

settings = Settings().validate()
