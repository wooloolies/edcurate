import src.lib.rate_limit as rate_limit_module
from src.lib.config import settings
from src.lib.rate_limit import (
    InMemoryRateLimiter,
    RateLimitConfig,
    RedisRateLimiter,
    get_rate_limiter,
)


def test_rate_limiter_uses_in_memory_when_redis_disabled():
    # Force reset global state for testing
    rate_limit_module._rate_limiter = None
    original_redis_url = settings.REDIS_URL
    settings.REDIS_URL = None

    try:
        config = RateLimitConfig(requests=10, window=60)
        limiter = get_rate_limiter(config)
        assert isinstance(limiter, InMemoryRateLimiter)
    finally:
        settings.REDIS_URL = original_redis_url
        rate_limit_module._rate_limiter = None


def test_rate_limiter_uses_redis_when_enabled():
    rate_limit_module._rate_limiter = None
    original_redis_url = settings.REDIS_URL
    settings.REDIS_URL = "redis://localhost:6379"

    try:
        config = RateLimitConfig(requests=10, window=60)
        limiter = get_rate_limiter(config)
        assert isinstance(limiter, RedisRateLimiter)
    finally:
        settings.REDIS_URL = original_redis_url
        rate_limit_module._rate_limiter = None
