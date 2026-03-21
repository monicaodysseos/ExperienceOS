"""
Celery Beat periodic tasks for booking lifecycle emails.

Schedule (set in settings.CELERY_BEAT_SCHEDULE):
  - send_booking_reminders   → every hour  (fires 48h-before emails)
  - send_review_requests     → every hour  (fires 24h-after emails)
"""
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


# ─── HTML helpers ────────────────────────────────────────────────────────────

def _base(title: str, body: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f6f1;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f1;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:24px 40px;">
            <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-.5px;">ExperienceOS</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 8px;font-size:26px;color:#1a1a2e;">{title}</h1>
            {body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #f0ede6;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © 2025 ExperienceOS · Nicosia, Cyprus
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def _btn(url: str, label: str, color: str = "#0d6655") -> str:
    return (
        f'<a href="{url}" style="display:inline-block;margin-top:24px;padding:14px 28px;'
        f'background:{color};color:#fff;border-radius:10px;text-decoration:none;'
        f'font-weight:600;font-size:15px;">{label}</a>'
    )


def _send(to: str, subject: str, html: str):
    """Send via Resend; silently no-ops if RESEND_API_KEY is unset (dev)."""
    api_key = getattr(settings, 'RESEND_API_KEY', None)
    if not api_key:
        return
    import resend
    resend.api_key = api_key
    resend.Emails.send({
        'from': settings.EMAIL_FROM,
        'to': to,
        'subject': subject,
        'html': html,
    })


# ─── Booking confirmation ────────────────────────────────────────────────────

@shared_task(bind=True, max_retries=3)
def send_booking_confirmation(self, booking_id: int):
    """Triggered immediately after a booking is confirmed by Stripe webhook."""
    from .models import Booking
    try:
        booking = Booking.objects.select_related(
            'experience', 'time_slot', 'participant'
        ).get(id=booking_id)
    except Booking.DoesNotExist:
        return

    participant = booking.participant
    exp = booking.experience
    slot_start = booking.time_slot.start_datetime
    booking_url = f"{settings.FRONTEND_URL}/bookings/{booking.booking_reference}"

    body = f"""
    <p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Hi {participant.first_name or 'there'}, your booking is confirmed! 🎉
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f8f6f1;border-radius:12px;padding:20px 24px;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Experience</td>
          <td style="padding:6px 0;font-weight:600;color:#1a1a2e;text-align:right;">{exp.title}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Date &amp; time</td>
          <td style="padding:6px 0;font-weight:600;color:#1a1a2e;text-align:right;">
            {slot_start.strftime('%d %b %Y, %H:%M')}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Reference</td>
          <td style="padding:6px 0;font-family:monospace;color:#1a1a2e;text-align:right;">
            {booking.booking_reference}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Participants</td>
          <td style="padding:6px 0;font-weight:600;color:#1a1a2e;text-align:right;">
            {booking.num_participants}</td></tr>
    </table>
    {_btn(booking_url, 'View Booking')}
    """

    html = _base("Booking confirmed!", body)
    try:
        _send(participant.email, f"Booking confirmed: {exp.title}", html)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


# ─── Booking reminder (48h before) ──────────────────────────────────────────

@shared_task
def send_booking_reminders():
    """
    Scheduled every hour via Celery Beat.
    Sends a reminder to participants whose experience starts in 48–49 hours.
    """
    from .models import Booking
    now = timezone.now()
    window_start = now + timedelta(hours=48)
    window_end = now + timedelta(hours=49)

    bookings = Booking.objects.filter(
        status__in=['confirmed', 'pending'],
        time_slot__start_datetime__gte=window_start,
        time_slot__start_datetime__lt=window_end,
        reminder_sent=False,
    ).select_related('experience', 'time_slot', 'participant')

    for booking in bookings:
        participant = booking.participant
        exp = booking.experience
        slot_start = booking.time_slot.start_datetime
        booking_url = f"{settings.FRONTEND_URL}/bookings/{booking.booking_reference}"

        body = f"""
        <p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0 0 16px;">
          Hi {participant.first_name or 'there'}, your experience is coming up in <strong>48 hours</strong>!
        </p>
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#f8f6f1;border-radius:12px;padding:20px 24px;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Experience</td>
              <td style="padding:6px 0;font-weight:600;color:#1a1a2e;text-align:right;">{exp.title}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Date &amp; time</td>
              <td style="padding:6px 0;font-weight:600;color:#1a1a2e;text-align:right;">
                {slot_start.strftime('%d %b %Y, %H:%M')}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Meeting point</td>
              <td style="padding:6px 0;color:#1a1a2e;text-align:right;">
                {exp.meeting_point or 'See booking details'}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">
          Free cancellation closes in 24 hours — after that, our standard policy applies.
        </p>
        {_btn(booking_url, 'View Booking Details')}
        """

        html = _base(f"Reminder: {exp.title} is in 48 hours", body)
        try:
            _send(participant.email, f"Reminder: {exp.title} tomorrow", html)
            booking.reminder_sent = True
            booking.save(update_fields=['reminder_sent'])
        except Exception:
            pass  # Will retry on next hourly run


# ─── Review request (24h after completion) ──────────────────────────────────

@shared_task
def send_review_requests():
    """
    Scheduled every hour via Celery Beat.
    Sends a review-request email to participants 24–25 hours after experience end.
    """
    from .models import Booking
    now = timezone.now()
    window_start = now - timedelta(hours=25)
    window_end = now - timedelta(hours=24)

    bookings = Booking.objects.filter(
        status='completed',
        time_slot__end_datetime__gte=window_start,
        time_slot__end_datetime__lt=window_end,
        review_request_sent=False,
    ).select_related('experience', 'time_slot', 'participant')

    for booking in bookings:
        participant = booking.participant
        exp = booking.experience
        review_url = f"{settings.FRONTEND_URL}/bookings/{booking.booking_reference}#review"

        body = f"""
        <p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0 0 16px;">
          Hi {participant.first_name or 'there'}, we hope you enjoyed <strong>{exp.title}</strong>!
        </p>
        <p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Reviews help other guests discover great experiences and support our providers.
          It only takes 30 seconds — how was it?
        </p>
        {_btn(review_url, 'Leave a Review ⭐', '#c0392b')}
        <p style="color:#9ca3af;font-size:12px;margin-top:32px;">
          You can always find your bookings at
          <a href="{settings.FRONTEND_URL}/bookings" style="color:#0d6655;">experienceos.com/bookings</a>
        </p>
        """

        html = _base(f"How was {exp.title}?", body)
        try:
            _send(participant.email, f"How was {exp.title}? Leave a review", html)
            booking.review_request_sent = True
            booking.save(update_fields=['review_request_sent'])
        except Exception:
            pass


# ─── Provider: new booking notification ─────────────────────────────────────

@shared_task(bind=True, max_retries=3)
def send_provider_booking_notification(self, booking_id: int):
    """Notifies the provider when a new booking is confirmed for their experience."""
    from .models import Booking
    try:
        booking = Booking.objects.select_related(
            'experience__provider__user', 'time_slot', 'participant'
        ).get(id=booking_id)
    except Booking.DoesNotExist:
        return

    provider_user = booking.experience.provider.user
    participant = booking.participant
    exp = booking.experience
    slot_start = booking.time_slot.start_datetime
    provider_url = f"{settings.FRONTEND_URL}/dashboard/provider/bookings"

    body = f"""
    <p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Hi {provider_user.first_name or 'there'}, you have a new booking for
      <strong>{exp.title}</strong>!
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f8f6f1;border-radius:12px;padding:20px 24px;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Guest</td>
          <td style="padding:6px 0;font-weight:600;color:#1a1a2e;text-align:right;">
            {participant.get_full_name()}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Date &amp; time</td>
          <td style="padding:6px 0;font-weight:600;color:#1a1a2e;text-align:right;">
            {slot_start.strftime('%d %b %Y, %H:%M')}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Participants</td>
          <td style="padding:6px 0;font-weight:600;color:#1a1a2e;text-align:right;">
            {booking.num_participants}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Reference</td>
          <td style="padding:6px 0;font-family:monospace;color:#1a1a2e;text-align:right;">
            {booking.booking_reference}</td></tr>
    </table>
    {_btn(provider_url, 'View in Dashboard')}
    """

    html = _base(f"New booking: {exp.title}", body)
    try:
        _send(provider_user.email, f"New booking for {exp.title}", html)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
