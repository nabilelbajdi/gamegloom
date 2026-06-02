# routers/oauth.py
"""
Social login endpoints (Authlib, server-side Authorization Code flow).

The browser only ever sees the existing HttpOnly auth cookie — the OAuth
token exchange happens here, server to provider. Each provider exposes a
login redirect and a callback; the callback resolves the identity to a local
user, issues our normal session token, and redirects back to the frontend.
"""
import logging

from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from fastapi import Depends

from ..core import security, oauth as oauth_module, oauth_service
from ..models.user import User
from ..models.user_oauth_account import UserOAuthAccount
from ...db_setup import get_db
from ...settings import settings

router = APIRouter(tags=["oauth"])
logger = logging.getLogger(__name__)


def _redirect_uri(provider: str) -> str:
    return f"{settings.OAUTH_REDIRECT_BASE}/auth/{provider}/callback"


def _frontend_redirect(success: bool, error: str | None = None) -> RedirectResponse:
    """Send the browser back to the frontend after the callback."""
    if success:
        target = f"{settings.FRONTEND_URL}/?login=success"
    else:
        target = f"{settings.FRONTEND_URL}/login?error={error or 'oauth_failed'}"
    return RedirectResponse(target, status_code=status.HTTP_303_SEE_OTHER)


async def _extract_identity(provider: str, client, token: dict) -> dict:
    """Pull a normalized identity from the provider's token/userinfo."""
    if provider == "google":
        info = token.get("userinfo") or await client.userinfo(token=token)
        return {
            "provider_account_id": str(info["sub"]),
            "email": info.get("email"),
            "email_verified": bool(info.get("email_verified")),
            "display_name": info.get("name"),
        }
    if provider == "github":
        # GitHub /user can return a null email (private), so read the verified
        # primary address from /user/emails explicitly.
        profile = (await client.get("user", token=token)).json()
        emails = (await client.get("user/emails", token=token)).json()
        primary = next((e for e in emails if e.get("primary") and e.get("verified")), None)
        return {
            "provider_account_id": str(profile["id"]),
            "email": primary["email"] if primary else None,
            "email_verified": bool(primary),
            "display_name": profile.get("name") or profile.get("login"),
        }
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported provider")


@router.get("/auth/providers")
async def list_providers():
    """Which social-login providers are configured (drives the frontend buttons)."""
    return {"providers": oauth_module.enabled_providers()}


@router.get("/me/connections")
async def list_connections(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db),
):
    """The current user's linked OAuth providers + whether they have a password."""
    providers = [
        a.provider
        for a in db.query(UserOAuthAccount).filter(UserOAuthAccount.user_id == current_user.id).all()
    ]
    return {"has_password": current_user.hashed_password is not None, "providers": providers}


@router.delete("/me/connections/{provider}", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_connection(
    provider: str,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db),
):
    """Unlink a provider, refusing to remove the user's only remaining sign-in method."""
    providers = {
        a.provider
        for a in db.query(UserOAuthAccount).filter(UserOAuthAccount.user_id == current_user.id).all()
    }
    if provider not in providers:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not linked")

    has_password = current_user.hashed_password is not None
    if not has_password and len(providers) == 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Set a password before removing your only sign-in method.",
        )

    db.query(UserOAuthAccount).filter(
        UserOAuthAccount.user_id == current_user.id,
        UserOAuthAccount.provider == provider,
    ).delete()
    db.commit()


@router.get("/auth/{provider}/login")
async def oauth_login(provider: str, request: Request):
    """Kick off the OAuth flow by redirecting to the provider."""
    if not oauth_module.is_enabled(provider):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not enabled")
    request.session.pop("oauth_link_user_id", None)  # ensure this is a login, not a link
    client = getattr(oauth_module.oauth, provider)
    return await client.authorize_redirect(request, _redirect_uri(provider))


@router.get("/auth/{provider}/link")
async def oauth_link(
    provider: str,
    request: Request,
    current_user: User = Depends(security.get_current_user),
):
    """Link a provider to the *currently logged-in* user (vs. logging in as it)."""
    if not oauth_module.is_enabled(provider):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not enabled")
    # Remember whose account to attach the identity to when the callback returns.
    request.session["oauth_link_user_id"] = current_user.id
    client = getattr(oauth_module.oauth, provider)
    return await client.authorize_redirect(request, _redirect_uri(provider))


@router.get("/auth/{provider}/callback")
async def oauth_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    """Handle the provider redirect: exchange code, resolve user, set session cookie."""
    if not oauth_module.is_enabled(provider):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not enabled")
    client = getattr(oauth_module.oauth, provider)

    try:
        token = await client.authorize_access_token(request)
        identity = await _extract_identity(provider, client, token)
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"OAuth callback failed for {provider}: {e}")
        return _frontend_redirect(success=False)

    # Link flow: attach this identity to the already-logged-in user instead of
    # logging in as whoever owns it. Keeps the current session untouched.
    link_user_id = request.session.pop("oauth_link_user_id", None)
    if link_user_id:
        result = oauth_service.link_provider(db, link_user_id, provider, identity["provider_account_id"])
        query = "error=already_linked" if result == "conflict" else f"linked={provider}"
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/settings?{query}",
            status_code=status.HTTP_303_SEE_OTHER,
        )

    try:
        user = oauth_service.find_or_create_user(
            db,
            provider=provider,
            provider_account_id=identity["provider_account_id"],
            email=identity["email"],
            email_verified=identity["email_verified"],
            display_name=identity["display_name"],
        )
    except HTTPException as e:
        logger.info(f"OAuth user resolution rejected for {provider}: {e.detail}")
        return _frontend_redirect(success=False, error="no_verified_email")

    db_token = security.create_token(db, user.id)
    csrf_value = security.generate_csrf_token()
    response = _frontend_redirect(success=True)
    security.set_auth_cookies(response, db_token.token, csrf_value)
    return response
