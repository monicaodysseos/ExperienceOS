from celery import shared_task
from django.conf import settings
from django.core import signing
from django.contrib.auth import get_user_model

User = get_user_model()


@shared_task(bind=True, max_retries=3)
def send_verification_email(self, user_id):
    import resend
    resend.api_key = settings.RESEND_API_KEY

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return

    # Create a signed token valid for 24 hours
    token = signing.dumps({'user_id': user_id}, salt='email-verification', compress=True)
    verify_url = f"{settings.FRONTEND_URL}/auth/verify-email?token={token}"

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="font-size: 28px; color: #1a1a2e; margin-bottom: 8px;">Verify your email</h1>
      <p style="color: #4a5568; font-size: 16px; margin-bottom: 32px;">
        Hi {user.first_name or 'there'}, click the button below to verify your ExperienceOS account.
      </p>
      <a href="{verify_url}"
         style="display:inline-block;padding:14px 28px;background:#c0392b;color:#fff;
                border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;">
        Verify Email Address
      </a>
      <p style="color:#9ca3af;font-size:13px;margin-top:32px;">
        This link expires in 24 hours. If you didn't create an account, you can ignore this email.
      </p>
    </div>
    """

    try:
        resend.Emails.send({
            'from': settings.EMAIL_FROM,
            'to': user.email,
            'subject': 'Verify your ExperienceOS account',
            'html': html_body,
        })
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def send_password_reset_email(self, user_id):
    import resend
    resend.api_key = settings.RESEND_API_KEY

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return

    token = signing.dumps({'user_id': user_id}, salt='password-reset', compress=True)
    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="font-size: 28px; color: #1a1a2e; margin-bottom: 8px;">Reset your password</h1>
      <p style="color: #4a5568; font-size: 16px; margin-bottom: 32px;">
        Hi {user.first_name or 'there'}, click below to set a new password for your account.
      </p>
      <a href="{reset_url}"
         style="display:inline-block;padding:14px 28px;background:#c0392b;color:#fff;
                border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;">
        Reset Password
      </a>
      <p style="color:#9ca3af;font-size:13px;margin-top:32px;">
        This link expires in 1 hour. If you didn't request this, you can safely ignore it.
      </p>
    </div>
    """

    try:
        resend.Emails.send({
            'from': settings.EMAIL_FROM,
            'to': user.email,
            'subject': 'Reset your ExperienceOS password',
            'html': html_body,
        })
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
