# core/oauth.py
"""
OAuth client registry (Authlib). Providers self-register only when their
client id/secret are configured, so the feature ships dormant: with no
credentials set, `enabled_providers()` is empty and the router 404s.
"""
from authlib.integrations.starlette_client import OAuth

from ...settings import settings

oauth = OAuth()

# Google — OpenID Connect via discovery document.
if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


def enabled_providers() -> list[str]:
    """Names of providers that have credentials configured."""
    return [name for name in ("google", "github") if getattr(oauth, name, None) is not None]


def is_enabled(provider: str) -> bool:
    return getattr(oauth, provider, None) is not None
