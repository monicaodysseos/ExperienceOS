from django.contrib import admin

from .models import TimeSlot, Booking


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['experience', 'start_datetime', 'spots_total', 'spots_remaining', 'is_active']
    list_filter = ['is_active', 'start_datetime']
    raw_id_fields = ['experience']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        'booking_reference', 'experience', 'participant',
        'num_participants', 'total_price', 'status', 'created_at',
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['booking_reference', 'participant__email', 'experience__title']
    raw_id_fields = ['participant', 'time_slot', 'experience']
    readonly_fields = ['booking_reference']
