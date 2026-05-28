# core/email_service.py
import logging
import resend
from ...settings import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """Send a password reset email. Returns True on success, False on failure."""
    if not settings.RESEND_API_KEY:
        logger.error("RESEND_API_KEY not configured — cannot send password reset email")
        return False

    resend.api_key = settings.RESEND_API_KEY

    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f0f; color: #fff; border-radius: 12px; padding: 40px 32px;">
      <h1 style="font-size: 24px; margin: 0 0 8px; color: #C8AA6E;">GameGloom</h1>
      <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 24px; color: #fff;">Reset your password</h2>
      <p style="color: #aaa; margin: 0 0 24px; line-height: 1.6;">
        We received a request to reset the password for your GameGloom account.
        Click the button below to choose a new password. This link expires in <strong style="color: #fff;">1 hour</strong>.
      </p>
      <a href="{reset_url}"
         style="display: inline-block; background: #C8AA6E; color: #000; font-weight: 700; font-size: 14px;
                text-decoration: none; padding: 12px 28px; border-radius: 8px; margin-bottom: 24px;">
        Reset Password
      </a>
      <p style="color: #666; font-size: 13px; margin: 0 0 8px;">
        If you didn't request this, you can safely ignore this email — your password won't change.
      </p>
      <p style="color: #444; font-size: 12px; margin: 0;">
        Or copy this link: <a href="{reset_url}" style="color: #C8AA6E;">{reset_url}</a>
      </p>
    </div>
    """

    try:
        resend.Emails.send({
            "from": settings.FROM_EMAIL,
            "to": [to_email],
            "subject": "Reset your GameGloom password",
            "html": html,
        })
        logger.info(f"Password reset email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {to_email}: {e}")
        return False
