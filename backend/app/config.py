from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Load local .env values while still allowing real environment variables.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Defaults keep Docker Compose simple for local development.
    database_url: str = "postgresql://inventory_user:inventory_pass@db:5432/inventory_db"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    low_stock_threshold: int = 10


# Single settings object imported by the app.
settings = Settings()
