"""Redis Caching Service with transparent InMemory fallback."""

import json
import logging
import fnmatch
from typing import Any, Dict, Optional, List

import redis
from app.config import settings

logger = logging.getLogger("burst.redis")


class InMemoryCache:
    """Mock Redis client for in-memory caching fallback."""

    def __init__(self):
        self._data: Dict[str, str] = {}

    def get(self, key: str) -> Optional[str]:
        return self._data.get(key)

    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        self._data[key] = value
        return True

    def delete(self, key: str) -> bool:
        if key in self._data:
            del self._data[key]
            return True
        return False

    def keys(self, pattern: str) -> List[str]:
        """Simple glob pattern matching for keys."""
        return fnmatch.filter(list(self._data.keys()), pattern)


class RedisService:
    """Wrapper service for Redis caching, supporting JSON serialization and room management."""

    def __init__(self):
        self.client: Any = None
        try:
            self.client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=2.0  # Fail fast if Redis is down
            )
            # Test connectivity
            self.client.ping()
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            logger.warning(
                f"Redis connection failed. Falling back to an in-memory Cache. "
                f"Error details: {e}"
            )
            self.client = InMemoryCache()

    def get_room_state(self, room_code: str) -> Optional[Dict[str, Any]]:
        """Retrieve serialized room game state from cache."""
        data = self.client.get(f"room:{room_code}")
        if data:
            try:
                return json.loads(data)
            except json.JSONDecodeError:
                return None
        return None

    def save_room_state(self, room_code: str, state_dict: Dict[str, Any], ttl: int = 7200) -> None:
        """Cache serialized room game state with a TTL (default 2 hours)."""
        self.client.set(f"room:{room_code}", json.dumps(state_dict), ex=ttl)

    def delete_room_state(self, room_code: str) -> None:
        """Remove room game state from cache."""
        self.client.delete(f"room:{room_code}")

    def list_active_room_codes(self) -> List[str]:
        """Retrieve all room codes currently active in cache."""
        keys = self.client.keys("room:*")
        return [k.split(":")[1] for k in keys if ":" in k]


redis_service = RedisService()
