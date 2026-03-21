from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'rating', 'comment', 'author_name',
            'provider_response', 'provider_responded_at',
            'created_at',
        ]

    def get_author_name(self, obj):
        return f'{obj.author.first_name} {obj.author.last_name[0]}.' if obj.author.last_name else obj.author.first_name


class ReviewCreateSerializer(serializers.Serializer):
    booking_reference = serializers.CharField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, default='')

    def validate_booking_reference(self, value):
        from bookings.models import Booking
        user = self.context['request'].user
        try:
            booking = Booking.objects.get(
                booking_reference=value,
                participant=user,
                status='completed',
            )
        except Booking.DoesNotExist:
            raise serializers.ValidationError('Booking not found or not completed.')

        if hasattr(booking, 'review'):
            raise serializers.ValidationError('Review already exists for this booking.')

        return booking

    def create(self, validated_data):
        booking = validated_data['booking_reference']
        return Review.objects.create(
            booking=booking,
            author=self.context['request'].user,
            experience=booking.experience,
            rating=validated_data['rating'],
            comment=validated_data.get('comment', ''),
        )


class ReviewResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
