"""
Economic News API - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.routers import news, analysis, ai
from app.services.database import Database
from app.services.cache import Cache

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting Economic News API...")
    await Database.connect()
    await Cache.connect()
    print("✅ Database and cache connected")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")
    await Database.disconnect()
    await Cache.disconnect()

app = FastAPI(
    title="Economic News API",
    description="API for economic news scraping and analysis for traders",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(news.router, prefix="/api/v1/news", tags=["News"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI Analysis"])

@app.get("/")
async def root():
    return {
        "name": "Economic News API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
