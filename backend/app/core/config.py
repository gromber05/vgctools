from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_SECRET = "solo-para-desarrollo-cambia-esta-clave-en-produccion"

LEGAL_VERSION = "2026-10-11"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: Literal["development", "production"] = "development"
    database_url: str = "sqlite:///./vgc_tools.db"
    secret_key: str = DEV_SECRET
    access_token_minutes: int = 60 * 24 * 7
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    max_teams_per_user: int = 100

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @model_validator(mode="after")
    def _check_production(self) -> "Settings":
        if self.is_production and (self.secret_key == DEV_SECRET or len(self.secret_key) < 32):
            raise ValueError("En producción SECRET_KEY es obligatoria y debe tener al menos 32 caracteres.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
