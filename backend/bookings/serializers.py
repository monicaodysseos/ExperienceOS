from decimal import Decimal

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from experiences.serializers import ExperienceListSerializer
from .models import TimeSlot, Booking


class TimeSlotSerializer(serializers.ModelSerializer):
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = TimeSlot
        fields = [
            'id', 'start_datetime', 'end_datetime',
            'spots_total', 'spots_remaining', 'is_available',
        ]

    def get_is_available(self, obj):
        return obj.is_active and obj.spots_remaining > 0 and obj.start_datetime > timezone.now()


class TimeSlotCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['start_datetime', 'end_datetime', 'spots_total']


class BookingSerializer(serializers.ModelSerializer):
    experience_title = serializers.CharField(source='experience.title', read_only=True)
    experience_slug = serializers.CharField(source='experience.slug', read_only=True)
    experience_city = serializers.CharField(source='experience.city', read_only=True)
    time_slot = TimeSlotSerializer(read_only=True)
    total_charged = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'experience_title', 'experience_slug',
            'experience_city', 'time_slot', 'num_participants',
            'unit_price', 'total_price', 'participant_service_fee',
            'total_charged', 'status', 'special_requests',
            'created_at', 'updated_at',
        ]

    def get_total_charged(self, obj):
        return str(obj.total_price + obj.participant_service_fee)


class BookingCreateSerializer(serializers.Serializer):
    time_slot_id = serializers.IntegerField()
    num_participants = serializers.IntegerField(min_value=1)
    special_requests = serializers.CharField(required=False, default='')

    def validate(self, data):
        try:
            slot = TimeSlot.objects.select_related('experience').get(
                id=data['time_slot_id'], is_active=True,
            )
        except TimeSlot.DoesNotExist:
            raise serializers.ValidationError('Time slot not found or inactive.')

        if slot.start_datetime <= timezone.now():
            raise serializers.ValidationError('This time slot has already passed.')

        if data['num_participants'] > slot.spots_remaining:
            raise serializers.ValidationError(
                f'Only {slot.spots_remaining} spots remaining.'
            )

        if data['num_participants'] < slot.experience.min_participants:
            raise serializers.ValidationError(
                f'Minimum {slot.experience.min_participants} participants required.'
            )

        data['time_slot'] = slot
        data['experience'] = slot.experience
        return data

    def create(self, validated_data):
        experience = validated_data['experience']
        slot = validated_data['time_slot']
        num = validated_data['num_participants']

        unit_price = experience.price_per_person
        total_price = unit_price * num
        commission_rate = Decimal(str(settings.PLATFORM_COMMISSION_RATE))
        service_fee_rate = Decimal(str(settings.PARTICIPANT_SERVICE_FEE_RATE))

        platform_fee = (total_price * commission_rate).quantize(Decimal('0.01'))
        provider_payout = total_price - platform_fee
        participant_service_fee = (total_price * service_fee_rate).quantize(Decimal('0.01'))

        slot.spots_remaining -= num
        slot.save(update_fields=['spots_remaining'])

        user = self.context['request'].user
        booking = Booking.objects.create(
            participant=user,
            org=user.org if user.org_id else None,
            time_slot=slot,
            experience=experience,
            num_participants=num,
            unit_price=unit_price,
            total_price=total_price,
            platform_fee=platform_fee,
            provider_payout=provider_payout,
            participant_service_fee=participant_service_fee,
            special_requests=validated_data.get('special_requests', ''),
        )
        return booking
