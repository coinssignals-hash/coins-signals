"""
Redis Cache Service
"""

from redis.asyncio import Redis
import json
from typing import Optional, Any
from app.config import get_settings

class Cache:
    client: Redis = None
    
    @classmethod
    async def connect(cls):
        settings = get_settings()
        try:
            cls.client = Redis.from_url(settings.redis_url)
            await cls.client.ping()
            return True
        except Exception as e:
            print(f"⚠️ Redis not available: {e}")
            cls.client = None
            return False
    
    @classmethod
    async def disconnect(cls):
        if cls.client:
            await cls.client.close()
            print("👋 Disconnected from Redis")
    
    @classmethod
    async def get(cls, key: str) -> Optional[Any]:
        if cls.client is None:
            return None
        try:
            data = await cls.client.get(key)
            if data:
                return json.loads(data)
        except Exception:
            pass
        return None
    
    @classmethod
    async def set(cls, key: str, value: Any, expire: int = 300):
        if cls.client is None:
            return
        try:
            await cls.client.set(key, json.dumps(value), ex=expire)
        except Exception:
            pass
    
    @classmethod
    async def delete(cls, key: str):
        if cls.client is None:
            return
        try:
            await cls.client.delete(key)
        except Exception:
            pass
