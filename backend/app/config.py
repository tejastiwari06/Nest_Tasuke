from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    SECRET_KEY: str = "secret"
    DEV_MODE: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""
    ALERT_CC: str = ""
    FRONTEND_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    ALERT_MIN_CONFIDENCE: float = 0.6
    ALERT_ON_DISTRESS: bool = False
    ALERT_COOLDOWN_SECONDS: int = 120
    DEFAULT_LAT: float | None = None
    DEFAULT_LON: float | None = None
    
    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"

settings = Settings()
