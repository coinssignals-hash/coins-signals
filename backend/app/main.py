"""
Economic News API - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.routers import news, analysis, ai, metaapi_proxy, cache_stats
from app.services.database import Database
from app.services.cache import Cache

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting Economic News API...")
    await Database.connect()
    cache_connected = await Cache.connect()
    
    # Print connection status
    db_status = "✅ Connected" if Database.client else "⚠️ Not available"
    cache_status = "✅ Connected" if Cache.client else "⚠️ Not available (running without cache)"
    print(f"📊 MongoDB: {db_status}")
    print(f"📦 Redis: {cache_status}")
    
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
app.include_router(metaapi_proxy.router, prefix="/api/v1/metaapi", tags=["MetaAPI Proxy"])

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
