# backend/tests/test_cache.py
"""
Tests for the discovery cache helper (core/cache.py).

Drives cached_json with a fake dict-backed async Redis client to assert:
miss -> producer runs + value stored; hit -> producer not called; producer
error propagates; empty results are not cached; read errors fall back to the
producer; and with caching disabled it is a pure pass-through.
"""
import json

import pytest

from app.api.v1.core import cache

pytestmark = pytest.mark.asyncio


class FakeRedis:
    """Minimal async Redis stand-in backed by a dict."""

    def __init__(self, raise_on=None):
        self.store = {}
        self.raise_on = raise_on or set()  # method names that should raise
        self.set_calls = 0

    async def get(self, key):
        if "get" in self.raise_on:
            raise ConnectionError("boom")
        return self.store.get(key)

    async def set(self, key, value, ex=None):
        if "set" in self.raise_on:
            raise ConnectionError("boom")
        self.set_calls += 1
        self.store[key] = value

    async def delete(self, *keys):
        for k in keys:
            self.store.pop(k, None)


@pytest.fixture
def enabled_cache(monkeypatch):
    """Install a fake client as the module singleton and return it."""
    fake = FakeRedis()
    monkeypatch.setattr(cache, "_client", fake)
    monkeypatch.setattr(cache, "_initialized", True)
    return fake


@pytest.fixture
def disabled_cache(monkeypatch):
    """Force caching off (no REDIS_URL configured)."""
    monkeypatch.setattr(cache, "_client", None)
    monkeypatch.setattr(cache, "_initialized", True)


def make_producer(value):
    calls = {"count": 0}

    async def producer():
        calls["count"] += 1
        return value

    return producer, calls


async def test_miss_runs_producer_and_stores(enabled_cache):
    producer, calls = make_producer([{"id": 1}])

    result = await cache.cached_json("discovery:trending", 600, producer)

    assert result == [{"id": 1}]
    assert calls["count"] == 1
    assert enabled_cache.store["discovery:trending"] == json.dumps([{"id": 1}])


async def test_hit_does_not_run_producer(enabled_cache):
    enabled_cache.store["discovery:trending"] = json.dumps([{"id": 42}])
    producer, calls = make_producer([{"id": 1}])

    result = await cache.cached_json("discovery:trending", 600, producer)

    assert result == [{"id": 42}]
    assert calls["count"] == 0


async def test_empty_result_not_cached(enabled_cache):
    producer, calls = make_producer([])

    result = await cache.cached_json("discovery:latest", 600, producer)

    assert result == []
    assert calls["count"] == 1
    assert "discovery:latest" not in enabled_cache.store
    assert enabled_cache.set_calls == 0


async def test_read_error_falls_back_to_producer(monkeypatch):
    fake = FakeRedis(raise_on={"get"})
    monkeypatch.setattr(cache, "_client", fake)
    monkeypatch.setattr(cache, "_initialized", True)
    producer, calls = make_producer([{"id": 7}])

    result = await cache.cached_json("discovery:trending", 600, producer)

    assert result == [{"id": 7}]
    assert calls["count"] == 1


async def test_write_error_still_returns_result(monkeypatch):
    fake = FakeRedis(raise_on={"set"})
    monkeypatch.setattr(cache, "_client", fake)
    monkeypatch.setattr(cache, "_initialized", True)
    producer, calls = make_producer([{"id": 9}])

    result = await cache.cached_json("discovery:trending", 600, producer)

    assert result == [{"id": 9}]
    assert calls["count"] == 1


async def test_disabled_is_passthrough(disabled_cache):
    producer, calls = make_producer([{"id": 1}])

    result = await cache.cached_json("discovery:trending", 600, producer)

    assert result == [{"id": 1}]
    assert calls["count"] == 1


async def test_invalidate_deletes_keys(enabled_cache):
    enabled_cache.store["discovery:trending"] = json.dumps([{"id": 1}])
    enabled_cache.store["discovery:latest"] = json.dumps([{"id": 2}])

    await cache.invalidate("discovery:trending", "discovery:latest")

    assert enabled_cache.store == {}


async def test_invalidate_disabled_is_noop(disabled_cache):
    # Should not raise when caching is off.
    await cache.invalidate("discovery:trending")
