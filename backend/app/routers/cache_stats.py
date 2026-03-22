"""
Cache Stats API Router
Endpoint for monitoring Redis cache performance
"""

from fastapi import APIRouter
from app.services.cache import Cache

router = APIRouter()


@router.get("/stats")
async def get_cache_stats():
    """Get Redis cache statistics (hits, misses, memory, keys)"""
    if Cache.client is None:
        return {
            "available": False,
            "message": "Redis not connected",
            "hits": 0,
            "misses": 0,
            "hit_rate": 0,
            "total_keys": 0,
            "memory_used": "0B",
            "uptime_seconds": 0,
        }

    try:
        info = await Cache.client.info()
        stats = info.get("keyspace_hits", 0)
        misses = info.get("keyspace_misses", 0)
        total = stats + misses
        hit_rate = round((stats / total * 100), 1) if total > 0 else 0

        # Count API-prefixed keys
        api_keys = []
        async for key in Cache.client.scan_iter(match="api:*", count=500):
            api_keys.append(key)

        memory = info.get("used_memory_human", "0B")
        uptime = info.get("uptime_in_seconds", 0)
        connected_clients = info.get("connected_clients", 0)
        total_commands = info.get("total_commands_processed", 0)
        evicted = info.get("evicted_keys", 0)
        expired = info.get("expired_keys", 0)

        return {
            "available": True,
            "hits": stats,
            "misses": misses,
            "hit_rate": hit_rate,
            "total_keys": len(api_keys),
            "memory_used": memory,
            "uptime_seconds": uptime,
            "connected_clients": connected_clients,
            "total_commands": total_commands,
            "evicted_keys": evicted,
            "expired_keys": expired,
        }
    except Exception as e:
        return {
            "available": False,
            "message": str(e),
            "hits": 0,
            "misses": 0,
            "hit_rate": 0,
            "total_keys": 0,
            "memory_used": "0B",
            "uptime_seconds": 0,
        }


@router.delete("/flush")
async def flush_cache():
    """Clear all API cache keys from Redis"""
    if Cache.client is None:
        return {"deleted": 0, "message": "Redis not connected"}

    try:
        deleted = 0
        async for key in Cache.client.scan_iter(match="api:*", count=500):
            await Cache.client.delete(key)
            deleted += 1
        return {"deleted": deleted, "message": f"Cleared {deleted} cached entries"}
    except Exception as e:
        return {"deleted": 0, "message": str(e)}
