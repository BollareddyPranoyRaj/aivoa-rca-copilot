import os
from typing import Optional

class Settings:
    PROJECT_NAME: str = "AIVOA.AI - Pharma API Root Cause Analysis"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg2://localhost/aivoa_rca"
    )
    SQLITE_FALLBACK_URL: str = "sqlite:///./aivoa_rca.db"
    
    # Groq AI
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    # Alternative reliable Groq models: "gemma2-9b-it", "llama-3.1-8b-instant"

settings = Settings()
