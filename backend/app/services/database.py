"""
MongoDB Database Service
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

class Database:
    client: AsyncIOMotorClient = None
    db = None
    
    @classmethod
    async def connect(cls):
        settings = get_settings()
        try:
            cls.client = AsyncIOMotorClient(settings.mongodb_url)
            cls.db = cls.client[settings.mongodb_db_name]
            # Test connection
            await cls.client.admin.command('ping')
            print(f"✅ Connected to MongoDB: {settings.mongodb_db_name}")
        except Exception as e:
            print(f"⚠️ MongoDB not available: {e}")
            cls.client = None
            cls.db = None
    
    @classmethod
    async def disconnect(cls):
        if cls.client:
            cls.client.close()
            print("👋 Disconnected from MongoDB")
    
    @classmethod
    def get_collection(cls, name: str):
        if cls.db is None:
            return None
        return cls.db[name]
