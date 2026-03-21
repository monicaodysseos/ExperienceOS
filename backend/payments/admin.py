from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'booking', 'stripe_payment_intent_id', 'amount',
        'currency', 'status', 'created_at',
    ]
    list_filter = ['status', 'currency']
    search_fields = ['stripe_payment_intent_id', 'booking__booking_reference']
    raw_id_fields = ['booking']
    readonly_fields = [
        'stripe_payment_intent_id', 'stripe_checkout_session_id',
        'stripe_transfer_id', 'stripe_refund_id',
    ]
