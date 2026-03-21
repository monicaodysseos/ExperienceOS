from django.db import models


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]

    booking = models.OneToOneField(
        'bookings.Booking', on_delete=models.PROTECT, related_name='payment',
    )
    stripe_payment_intent_id = models.CharField(max_length=200, unique=True)
    stripe_checkout_session_id = models.CharField(max_length=200, blank=True)
    stripe_transfer_id = models.CharField(max_length=200, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='EUR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stripe_refund_id = models.CharField(max_length=200, blank=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'

    def __str__(self):
        return f'Payment {self.stripe_payment_intent_id} - {self.status}'


class InvoiceSequence(models.Model):
    """Atomic counter per year for sequential invoice numbers."""
    year = models.PositiveIntegerField(unique=True)
    last_number = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'invoice_sequences'


def generate_invoice_number():
    from django.db import transaction
    from django.utils import timezone
    year = timezone.now().year
    with transaction.atomic():
        seq, _ = InvoiceSequence.objects.select_for_update().get_or_create(
            year=year, defaults={'last_number': 0}
        )
        seq.last_number += 1
        seq.save(update_fields=['last_number'])
        return f'EXP-{year}-{str(seq.last_number).zfill(5)}'


class Invoice(models.Model):
    booking = models.OneToOneField(
        'bookings.Booking', on_delete=models.PROTECT, related_name='invoice',
    )
    org = models.ForeignKey(
        'organizations.Organisation', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='invoices',
    )
    invoice_number = models.CharField(max_length=20, unique=True, default=generate_invoice_number)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    vat_rate = models.DecimalField(max_digits=5, decimal_places=4, default='0.1900')
    vat_amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_with_vat = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='EUR')
    billing_name = models.CharField(max_length=200)
    billing_email = models.EmailField()
    billing_address = models.JSONField(null=True, blank=True)
    pdf_generated = models.BooleanField(default=False)
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-issued_at']

    def __str__(self):
        return self.invoice_number


class Payout(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    ]
    provider = models.ForeignKey(
        'accounts.ProviderProfile', on_delete=models.PROTECT, related_name='payouts',
    )
    stripe_payout_id = models.CharField(max_length=100, blank=True, db_index=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='EUR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    period_start = models.DateTimeField(null=True, blank=True)
    period_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payouts'
        ordering = ['-created_at']

    def __str__(self):
        return f'Payout {self.stripe_payout_id or self.id} - {self.status}'
