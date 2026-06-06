import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    STORAGE_DIR: str = str(PROJECT_ROOT / "storage" / "documents")
    SUPABASE_URL: str = "http://127.0.0.1:54321"
    SUPABASE_ANON_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Asegurar que el directorio de almacenamiento exista
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
