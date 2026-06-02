# core/cache.py
"""
Lightweight async Redis cache for the discovery list endpoints.

Caching is opt-in: when settings.REDIS_URL is empty the helpers become a
pass-through and callers hit the database exactly as before. Redis is never
allowed to break a request — any connection or protocol error falls back to
the producer and is logged.
"""
import json
import logging
from typing import Any, Awaitable, Callable

import redis.asyncio as aioredis

from ...settings import settings

logger = logging.getLogger(__name__)

# Lazy module-level singleton. None means caching is disabled.
_client: aioredis.Redis | None = None
_initialized = False


def _get_client() -> aioredis.Redis | None:
    """Build (once) and return the async Redis client, or None if disabled."""
    global _client, _initialized
    if _initialized:
        return _client
    _initialized = True
    if settings.REDIS_URL:
        try:
            _client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            logger.info("Discovery cache enabled (Redis)")
        except Exception as e:
            logger.warning(f"Failed to init Redis client, caching disabled: {e}")
            _client = None
    return _client


async def cached_json(
    key: str,
    ttl_seconds: int,
    producer: Callable[[], Awaitable[Any]],
) -> Any:
    """Return cached JSON for `key`, or run `producer()` and cache its result.

    - Caching disabled (no REDIS_URL) -> just awaits and returns producer().
    - Cache hit -> returns the decoded cached value, producer not called.
    - Cache miss -> runs producer(); caches the result under `key` for
      `ttl_seconds` only when it is non-empty (avoids caching a transient
      empty list during a cold start / IGDB hiccup).
    - Any Redis error -> logs and falls back to producer().
    """
    client = _get_client()
    if client is None:
        return await producer()

    try:
        cached = await client.get(key)
        if cached is not None:
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"Cache read failed for {key}, falling back to source: {e}")
        return await producer()

    result = await producer()

    if result:
        try:
            await client.set(key, json.dumps(result), ex=ttl_seconds)
        except Exception as e:
            logger.warning(f"Cache write failed for {key}: {e}")

    return result


async def invalidate(*keys: str) -> None:
    """Delete one or more cache keys. No-op when caching is disabled or on error."""
    client = _get_client()
    if client is None or not keys:
        return
    try:
        await client.delete(*keys)
    except Exception as e:
        logger.warning(f"Cache invalidation failed for {keys}: {e}")
