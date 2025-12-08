# settings.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # IGDB settings
    IGDB_CLIENT_ID: str = os.getenv("IGDB_CLIENT_ID", "")
    IGDB_ACCESS_TOKEN: str = os.getenv("IGDB_ACCESS_TOKEN", "")
    IGDB_WEBHOOK_SECRET: str = os.getenv("IGDB_WEBHOOK_SECRET", "")
    IGDB_URL: str = "https://api.igdb.com/v4/games"

    def validate(self):
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL must be set in environment variables")
        if not self.IGDB_CLIENT_ID:
            raise ValueError("IGDB_CLIENT_ID must be set in environment variables")
        if not self.IGDB_ACCESS_TOKEN:
            raise ValueError("IGDB_ACCESS_TOKEN must be set in environment variables")
        if not self.IGDB_WEBHOOK_SECRET:
            raise ValueError("IGDB_WEBHOOK_SECRET must be set in environment variables")
        return self

settings = Settings().validate()
