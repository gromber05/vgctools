from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración leída de variables de entorno (o de un archivo .env)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./vgc_tools.db"
    # Firma los tokens de sesión. En producción pon una propia y larga (SECRET_KEY en .env).
    secret_key: str = "solo-para-desarrollo-cambia-esta-clave-en-produccion"
    access_token_minutes: int = 60 * 24 * 30
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
