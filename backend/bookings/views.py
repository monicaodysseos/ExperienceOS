from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TimeSlot, Booking
from .serializers import (
    TimeSlotSerializer,
    TimeSlotCreateSerializer,
    BookingSerializer,
    BookingCreateSerializer,
)


class TimeSlotListView(generics.ListAPIView):
    serializer_class = TimeSlotSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        slug = self.kwargs['slug']
        return TimeSlot.objects.filter(
            experience__slug=slug,
            is_active=True,
            start_datetime__gt=timezone.now(),
            spots_remaining__gt=0,
        )


class TimeSlotCreateView(generics.CreateAPIView):
    serializer_class = TimeSlotCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        from experiences.models import Experience
        slug = self.kwargs['slug']
        experience = Experience.objects.get(
            slug=slug, provider__user=self.request.user,
        )
        serializer.save(experience=experience)


class TimeSlotUpdateView(generics.UpdateAPIView):
    serializer_class = TimeSlotCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        slug = self.kwargs['slug']
        return TimeSlot.objects.filter(
            experience__slug=slug,
            experience__provider__user=self.request.user,
        )


class TimeSlotDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        slug = self.kwargs['slug']
        return TimeSlot.objects.filter(
            experience__slug=slug,
            experience__provider__user=self.request.user,
        )

    def destroy(self, request, *args, **kwargs):
        slot = self.get_object()
        if slot.bookings.filter(status='confirmed').exists():
            return Response(
                {'detail': 'Cannot delete a slot with confirmed bookings.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class BookingCreateView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )


class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(
            participant=self.request.user,
        ).select_related('experience', 'time_slot')


class BookingDetailView(generics.RetrieveAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'booking_reference'

    def get_queryset(self):
        return Booking.objects.filter(
            participant=self.request.user,
        ).select_related('experience', 'time_slot')


class BookingCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_reference):
        try:
            booking = Booking.objects.get(
                booking_reference=booking_reference,
                participant=request.user,
                status='confirmed',
            )
        except Booking.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        hours_until = (booking.time_slot.start_datetime - timezone.now()).total_seconds() / 3600

        if hours_until > 48:
            refund_percentage = 100
        elif hours_until > 24:
            refund_percentage = 50
        else:
            refund_percentage = 0

        booking.status = 'cancelled_by_participant'
        booking.cancelled_at = timezone.now()
        booking.cancellation_reason = request.data.get('reason', '')
        booking.save()

        # Restore spots
        booking.time_slot.spots_remaining += booking.num_participants
        booking.time_slot.save(update_fields=['spots_remaining'])

        return Response({
            'status': 'cancelled',
            'refund_percentage': refund_percentage,
            'booking_reference': booking.booking_reference,
        })


class ProviderBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(
            experience__provider__user=self.request.user,
        ).select_related('experience', 'time_slot', 'participant')
