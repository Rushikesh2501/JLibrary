import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://postgres.skwvgmvtclzuortaspcz:3401JagtapLib@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
    SUPABASE_URL: str = "https://skwvgmvtclzuortaspcz.supabase.co"
    SUPABASE_KEY: str = "sb_publishable_UCHu3PVFMkBJ1ixd2C3CsQ_A178UK4e"
    REACT_APP_SUPABASE_URL: str = ""
    REACT_APP_SUPABASE_PUBLISHABLE_KEY: str = ""

    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=(".env", "JLIB_BE/.env", "../JLIB_BE/.env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

