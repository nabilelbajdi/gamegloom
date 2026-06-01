"""Shared slowapi limiter so routers can apply per-endpoint limits without importing main."""
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

RATE_LIMIT = os.getenv("RATE_LIMIT", "60/minute")
limiter = Limiter(key_func=get_remote_address, default_limits=[RATE_LIMIT])
