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
    
    # Steam Integration settings (optional - leave empty to disable)
    STEAM_API_KEY: str = os.getenv("STEAM_API_KEY", "")
    STEAM_OPENID_REALM: str = os.getenv("STEAM_OPENID_REALM", "http://localhost:5173")
    STEAM_OPENID_RETURN_TO: str = os.getenv("STEAM_OPENID_RETURN_TO", "http://localhost:8000/api/v1/integrations/steam/callback")
    
    # PSN Integration settings (required for PSN features)
    PSN_NPSSO: str = os.getenv("PSN_NPSSO", "")

    # Email settings (Resend)
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "GameGloom <noreply@gamegloom.com>")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Cloudinary (avatar storage)
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")

    # Dev convenience: when true, new registrations are auto-verified (no email sent).
    # Must remain false in production.
    SKIP_EMAIL_VERIFICATION: bool = os.getenv("SKIP_EMAIL_VERIFICATION", "false").lower() == "true"

    # Auth cookie settings: the auth token lives in an HttpOnly cookie.
    # Dev defaults work over http://localhost. In production set COOKIE_SECURE=true
    # and COOKIE_DOMAIN=.gamegloom.com so the cookie is shared with api.gamegloom.com.
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    COOKIE_DOMAIN: str = os.getenv("COOKIE_DOMAIN", "")  # empty = host-only cookie
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")

    # OAuth social login (optional): leave a provider's client id/secret empty to
    # disable that provider — its endpoints 404 and the frontend hides the button.
    # OAUTH_SESSION_SECRET signs the short-lived cookie that carries OAuth state/PKCE
    # across the provider redirect. Callbacks redirect back to FRONTEND_URL.
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    OAUTH_SESSION_SECRET: str = os.getenv("OAUTH_SESSION_SECRET", "")
    # Base URL the provider redirects back to; the callback path is appended.
    # Must exactly match the redirect URI registered in the provider console.
    OAUTH_REDIRECT_BASE: str = os.getenv("OAUTH_REDIRECT_BASE", "http://localhost:8000/api/v1")

    # Discovery cache (optional): caches the four discovery list endpoints in Redis.
    # Leave REDIS_URL empty to disable — the cache layer becomes a pass-through and
    # endpoints query the database exactly as before. Set to an Upstash rediss:// URL
    # in production to enable.
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    DISCOVERY_CACHE_TTL: int = int(os.getenv("DISCOVERY_CACHE_TTL", "600"))

    def validate(self):
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL must be set in environment variables")
        if not self.IGDB_CLIENT_ID:
            raise ValueError("IGDB_CLIENT_ID must be set in environment variables")
        if not self.IGDB_ACCESS_TOKEN:
            raise ValueError("IGDB_ACCESS_TOKEN must be set in environment variables")
        if not self.IGDB_WEBHOOK_SECRET:
            raise ValueError("IGDB_WEBHOOK_SECRET must be set in environment variables")
        if not self.RESEND_API_KEY:
            import logging
            logging.getLogger(__name__).warning("RESEND_API_KEY not set — password reset emails will not be sent")
        if self.SKIP_EMAIL_VERIFICATION:
            import logging
            logging.getLogger(__name__).warning("SKIP_EMAIL_VERIFICATION is enabled — new accounts auto-verified. Disable in production.")
        return self

settings = Settings().validate()
