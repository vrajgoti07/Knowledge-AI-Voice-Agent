import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("knowledge_ai.redis")

_redis_client = None

def get_redis_client():
    """
    Returns a synchronous or asynchronous Redis client depending on availability.
    Falls back gracefully if Redis is unavailable.
    """
    global _redis_client
    if _redis_client is None:
        try:
            import redis
            redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
            _redis_client = redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=3.0)
            _redis_client.ping()
            logger.info("Successfully connected to Redis server.")
        except Exception as e:
            logger.warning(f"Redis server unavailable at {getattr(settings, 'REDIS_URL', 'localhost')}: {e}")
            _redis_client = False

    return _redis_client if _redis_client is not False else None


def blacklist_jwt_token(jti: str, expire_seconds: int = 86400) -> bool:
    """
    Blacklists a JWT token (jti) until it expires.
    """
    r = get_redis_client()
    if not r:
        return False
    try:
        r.setex(f"blacklist:{jti}", expire_seconds, "1")
        return True
    except Exception as e:
        logger.error(f"Error blacklisting token {jti} in Redis: {e}")
        return False


def is_token_blacklisted(jti: str) -> bool:
    """
    Checks if a JWT token (jti) is blacklisted.
    """
    r = get_redis_client()
    if not r:
        return False
    try:
        return bool(r.exists(f"blacklist:{jti}"))
    except Exception as e:
        logger.error(f"Error checking blacklisted token {jti} in Redis: {e}")
        return False


def check_rate_limit(user_key: str, limit: int = 60, window_seconds: int = 60) -> bool:
    """
    Per-user sliding window / counter rate limiter.
    Returns True if request is ALLOWED, False if limit EXCEEDED.
    """
    r = get_redis_client()
    if not r:
        return True  # Allow request if Redis is offline

    try:
        redis_key = f"rate_limit:{user_key}"
        current = r.get(redis_key)
        if current is not None and int(current) >= limit:
            return False

        pipe = r.pipeline()
        pipe.incr(redis_key)
        if current is None:
            pipe.expire(redis_key, window_seconds)
        pipe.execute()
        return True
    except Exception as e:
        logger.error(f"Rate limiting check error for {user_key}: {e}")
        return True
