"""
Application configuration
"""

from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    env: str = "development"
    debug: bool = True
    
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "economic_news"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # OpenAI
    openai_api_key: str = ""
    
    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:8080"
    
    # Scraping
    scrape_interval_minutes: int = 30
    
    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache
def get_settings() -> Settings:
    return Settings()
