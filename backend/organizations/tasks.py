from celery import shared_task
from django.conf import settings


@shared_task(bind=True, max_retries=3)
def send_team_invite_email(self, invite_id):
    import resend
    from .models import OrganisationInvite

    resend.api_key = settings.RESEND_API_KEY

    try:
        invite = OrganisationInvite.objects.select_related('org', 'invited_by').get(id=invite_id)
    except OrganisationInvite.DoesNotExist:
        return

    invite_url = f"{settings.FRONTEND_URL}/auth/register?invite={invite.token}"
    inviter_name = invite.invited_by.get_full_name() if invite.invited_by else 'Your colleague'

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You've been invited to join {invite.org.name} on ExperienceOS</h2>
      <p>{inviter_name} has invited you to manage team experiences for {invite.org.name}.</p>
      <p>
        <a href="{invite_url}"
           style="display:inline-block;padding:12px 24px;background:#c0392b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Accept Invitation
        </a>
      </p>
      <p style="color:#666;font-size:13px;">This invitation expires in 7 days.</p>
    </div>
    """

    try:
        resend.Emails.send({
            'from': settings.EMAIL_FROM,
            'to': invite.email,
            'subject': f"You're invited to join {invite.org.name} on ExperienceOS",
            'html': html_body,
        })
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
