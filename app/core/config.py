from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "School Management System"
    environment: str = "development"

    database_url: str = "sqlite:///./school.db"

    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8

    first_admin_email: str = "admin@example.com"
    first_admin_password: str = "changeme123"


settings = Settings()
