from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    jwt_secret_key: str = "unsafe-development-secret-change-me"
    database_url: str = "sqlite:///./resume_analyzer.db"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    max_upload_bytes: int = 5 * 1024 * 1024
    access_token_minutes: int = 60 * 12

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
