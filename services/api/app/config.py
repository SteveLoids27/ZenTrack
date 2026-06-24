from typing import Optional
from urllib.parse import quote_plus

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "ZenTrack API"
    api_v1_prefix: str = "/api/v1"
    database_url: Optional[str] = None
    db_host: Optional[str] = None
    db_port: int = 5432
    db_user: str = "postgres"
    db_password: str = "postgres"
    db_name: str = "zentrack"
    cors_origins: str = "*"
    jwt_secret_key: str = "change-me-to-a-long-random-secret-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sqlalchemy_database_url(self) -> str:
        if self.db_host:
            password = quote_plus(self.db_password)
            return f"postgresql://{self.db_user}:{password}@{self.db_host}:{self.db_port}/{self.db_name}"
        if self.database_url:
            return self.database_url
        return "postgresql://postgres:postgres@localhost:5432/zentrack"


settings = Settings()
