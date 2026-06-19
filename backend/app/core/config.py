import os
from typing import List, Set
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CreackEduHelp API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Security
    JWT_SECRET: str = "super_secret_jwt_key_for_creackeduhelp_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database & Cache
    DATABASE_URL: str = "postgresql://eduhelp_user:eduhelp_password@localhost:5432/eduhelp_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Local Storage Directory
    STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "storage")

    # Allowed services
    ALLOWED_SERVICES: List[str] = [
        "PPT Presentation",
        "Report Formatting",
        "Research Assistance",
        "Proofreading & Editing",
        "Referencing & Citation",
        "Data Analysis",
        "Programming Support",
        "Document Design"
    ]

    # Prohibited keywords to reinforce ethics (returns validation errors to student)
    PROHIBITED_KEYWORDS: List[str] = [
        "exam", "quiz", "test", "cheat", "impersonate", "credential", 
        "take my", "write my exam", "do my exam", "live test", "midterm", "final exam"
    ]

    # Priority Multipliers
    PRIORITY_MULTIPLIERS: dict = {
        "standard": 1.0,
        "urgent": 1.5,
        "express": 2.0
    }

    # File Upload Specs
    ALLOWED_EXTENSIONS: Set[str] = {
        "pdf", "docx", "pptx", "xlsx", "zip", "png", "jpg", "jpeg"
    }
    MAX_FILE_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure local storage path exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
