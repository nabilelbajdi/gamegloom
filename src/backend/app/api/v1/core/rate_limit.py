"""Shared slowapi limiter so routers can apply per-endpoint limits without importing main."""
import os
import sys
from slowapi import Limiter
from slowapi.util import get_remote_address

RATE_LIMIT = os.getenv("RATE_LIMIT", "60/minute")

# Disable rate limiting during test runs — tests hit /register many times from
# 127.0.0.1 in quick succession and would otherwise trip per-endpoint limits.
_IN_TEST = "pytest" in sys.modules or os.getenv("TESTING", "").lower() == "true"

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[RATE_LIMIT],
    enabled=not _IN_TEST,
)
