from django.db import models, transaction
from django.utils import timezone


class BookingSequence(models.Model):
    """Atomic counter per year for human-readable booking references."""
    year = models.PositiveIntegerField(unique=True)
    last_number = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'booking_sequences'

    def __str__(self):
        return f'Sequence {self.year}: {self.last_number}'


def generate_booking_reference():
    year = timezone.now().year
    with transaction.atomic():
        seq, _ = BookingSequence.objects.select_for_update().get_or_create(
            year=year, defaults={'last_number': 0}
        )
        seq.last_number += 1
        seq.save(update_fields=['last_number'])
        return f'EXP-{year}-{str(seq.last_number).zfill(5)}'


class TimeSlot(models.Model):
    experience = models.ForeignKey(
        'experiences.Experience',
        on_delete=models.CASCADE,
        related_name='time_slots',
    )
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    spots_total = models.PositiveIntegerField()
    spots_remaining = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'time_slots'
        ordering = ['start_datetime']
        indexes = [
            models.Index(fields=['experience', 'start_datetime', 'is_active']),
        ]

    def __str__(self):
        return f'{self.experience.title} - {self.start_datetime}'

    def save(self, *args, **kwargs):
        if not self.pk:
            self.spots_remaining = self.spots_total
        super().save(*args, **kwargs)


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Payment'),
        ('confirmed', 'Confirmed'),
        ('cancelled_by_participant', 'Cancelled by Participant'),
        ('cancelled_by_provider', 'Cancelled by Provider'),
        ('completed', 'Completed'),
        ('no_show', 'No Show'),
        ('refunded', 'Refunded'),
    ]

    booking_reference = models.CharField(
        max_length=20, unique=True, default=generate_booking_reference, editable=False,
    )
    participant = models.ForeignKey(
        'accounts.User', on_delete=models.PROTECT, related_name='bookings',
    )
    org = models.ForeignKey(
        'organizations.Organisation',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='bookings',
        help_text='Set when booked by an HR Manager on behalf of their organisation.',
    )
    time_slot = models.ForeignKey(
        TimeSlot, on_delete=models.PROTECT, related_name='bookings',
    )
    experience = models.ForeignKey(
        'experiences.Experience', on_delete=models.PROTECT, related_name='bookings',
    )
    num_participants = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2)
    provider_payout = models.DecimalField(max_digits=10, decimal_places=2)
    participant_service_fee = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    special_requests = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    reminder_sent = models.BooleanField(default=False)
    review_request_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['participant', 'status']),
            models.Index(fields=['booking_reference']),
        ]

    def __str__(self):
        return f'{self.booking_reference} - {self.experience.title}'
