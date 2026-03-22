"""
Redis cache decorator for FastAPI endpoints
"""

from functools import wraps
from app.services.cache import Cache
import hashlib
import json


def cached(prefix: str, ttl: int = 300):
    """
    Decorator that caches endpoint results in Redis.
    
    Args:
        prefix: Cache key prefix (e.g., 'analysis', 'news')
        ttl: Time-to-live in seconds (default 5 minutes)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key from prefix + all args
            key_parts = [prefix] + [str(a) for a in args] + [f"{k}={v}" for k, v in sorted(kwargs.items()) if v is not None]
            raw_key = ":".join(key_parts)
            cache_key = f"api:{hashlib.md5(raw_key.encode()).hexdigest()}" if len(raw_key) > 200 else f"api:{raw_key}"

            # Try cache first
            cached_data = await Cache.get(cache_key)
            if cached_data is not None:
                return {**cached_data, "_cached": True}

            # Call original function
            result = await func(*args, **kwargs)

            # Store in cache (convert pydantic/dict to serializable)
            try:
                serializable = result if isinstance(result, (dict, list)) else result
                await Cache.set(cache_key, serializable, expire=ttl)
            except Exception:
                pass

            return result

        return wrapper
    return decorator
