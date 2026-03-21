from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_NEW_MESSAGE = 'new_message'
    TYPE_NEW_BOOKING = 'new_booking'

    TYPE_CHOICES = [
        (TYPE_NEW_MESSAGE, 'New Message'),
        (TYPE_NEW_BOOKING, 'New Booking'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    body = models.CharField(max_length=500, blank=True)
    link = models.CharField(max_length=300)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user_id} — {self.title}'
