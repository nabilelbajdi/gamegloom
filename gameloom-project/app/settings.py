from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DB_URL: str
    IGDB_CLIENT_ID: str
    IGDB_ACCESS_TOKEN: str

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings() 