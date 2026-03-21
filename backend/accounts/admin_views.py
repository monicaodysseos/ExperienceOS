"""
Platform admin API views — accessible only to staff / admin-role users.
Routes are mounted at /api/v1/platform-admin/ to avoid clashing with Django admin.
"""
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from rest_framework import permissions, serializers as drf_serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ProviderProfile

User = get_user_model()


class IsAdminUser(permissions.BasePermission):
    """Staff flag OR role == 'admin'."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.is_staff or request.user.role == 'admin'


# ─── Serializers ─────────────────────────────────────────────────────────────

class AdminVendorSerializer(drf_serializers.ModelSerializer):
    user_email = drf_serializers.EmailField(source='user.email', read_only=True)
    user_name = drf_serializers.SerializerMethodField()
    experience_count = drf_serializers.SerializerMethodField()
    joined_at = drf_serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = ProviderProfile
        fields = [
            'id', 'user_email', 'user_name', 'display_name', 'tagline',
            'is_verified', 'stripe_onboarding_complete', 'stripe_charges_enabled',
            'experience_count', 'joined_at',
        ]

    def get_user_name(self, obj):
        return f'{obj.user.first_name} {obj.user.last_name}'.strip()

    def get_experience_count(self, obj):
        return obj.experiences.exclude(status='archived').count()


class AdminUserSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role',
            'is_email_verified', 'is_active', 'date_joined',
        ]


# ─── Views ───────────────────────────────────────────────────────────────────

class AdminVendorListView(APIView):
    """GET all vendor profiles, filterable by ?verified=true/false."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = ProviderProfile.objects.select_related('user').prefetch_related('experiences')
        verified = request.query_params.get('verified')
        if verified == 'false':
            qs = qs.filter(is_verified=False)
        elif verified == 'true':
            qs = qs.filter(is_verified=True)
        qs = qs.order_by('-created_at')
        serializer = AdminVendorSerializer(qs, many=True)
        return Response({'results': serializer.data, 'count': qs.count()})


class AdminVendorApproveView(APIView):
    """POST /api/v1/platform-admin/vendors/:id/approve/ — set is_verified=True."""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            profile = ProviderProfile.objects.get(pk=pk)
        except ProviderProfile.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        profile.is_verified = True
        profile.save(update_fields=['is_verified'])
        return Response(AdminVendorSerializer(profile).data)


class AdminVendorRejectView(APIView):
    """POST /api/v1/platform-admin/vendors/:id/reject/ — set is_verified=False."""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            profile = ProviderProfile.objects.get(pk=pk)
        except ProviderProfile.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        profile.is_verified = False
        profile.save(update_fields=['is_verified'])
        return Response(AdminVendorSerializer(profile).data)


class AdminExperienceListView(APIView):
    """GET all experiences across all statuses."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from experiences.models import Experience
        from experiences.serializers import ExperienceListSerializer

        qs = Experience.objects.select_related('category', 'provider', 'provider__user')
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        else:
            qs = qs.exclude(status='archived')
        qs = qs.order_by('-created_at')

        # Paginate manually
        page_size = 20
        try:
            page = int(request.query_params.get('page', 1))
        except ValueError:
            page = 1
        total = qs.count()
        start = (page - 1) * page_size
        items = qs[start:start + page_size]
        serializer = ExperienceListSerializer(items, many=True)
        return Response({'results': serializer.data, 'count': total})


class AdminExperienceApproveView(APIView):
    """POST /api/v1/platform-admin/experiences/:slug/approve/ — set status='active'."""
    permission_classes = [IsAdminUser]

    def post(self, request, slug):
        from experiences.models import Experience
        from experiences.serializers import ExperienceListSerializer
        try:
            exp = Experience.objects.get(slug=slug)
        except Experience.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        exp.status = 'active'
        exp.save(update_fields=['status'])
        return Response(ExperienceListSerializer(exp).data)


class AdminExperienceRejectView(APIView):
    """POST /api/v1/platform-admin/experiences/:slug/reject/ — set status='draft'."""
    permission_classes = [IsAdminUser]

    def post(self, request, slug):
        from experiences.models import Experience
        from experiences.serializers import ExperienceListSerializer
        try:
            exp = Experience.objects.get(slug=slug)
        except Experience.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        reason = request.data.get('reason', '')
        exp.status = 'draft'
        exp.save(update_fields=['status'])
        return Response({'detail': f'Experience set to draft. Reason: {reason}'})


class AdminBookingListView(APIView):
    """GET all platform bookings."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from bookings.models import Booking
        from bookings.serializers import BookingSerializer

        qs = Booking.objects.select_related(
            'experience', 'time_slot', 'participant', 'org'
        ).order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        q = request.query_params.get('q')
        if q:
            from django.db.models import Q
            qs = qs.filter(
                Q(booking_reference__icontains=q) |
                Q(experience__title__icontains=q) |
                Q(participant__email__icontains=q)
            )

        page_size = 20
        try:
            page = int(request.query_params.get('page', 1))
        except ValueError:
            page = 1
        total = qs.count()
        start = (page - 1) * page_size
        items = qs[start:start + page_size]
        serializer = BookingSerializer(items, many=True)
        return Response({'results': serializer.data, 'count': total})


class AdminUserListView(APIView):
    """GET all platform users."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = User.objects.filter(deleted_at__isnull=True).order_by('-date_joined')
        role = request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        q = request.query_params.get('q')
        if q:
            from django.db.models import Q
            qs = qs.filter(Q(email__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q))

        page_size = 20
        try:
            page = int(request.query_params.get('page', 1))
        except ValueError:
            page = 1
        total = qs.count()
        start = (page - 1) * page_size
        items = qs[start:start + page_size]
        serializer = AdminUserSerializer(items, many=True)
        return Response({'results': serializer.data, 'count': total})


class AdminStatsView(APIView):
    """GET platform-wide stats for admin dashboard."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from bookings.models import Booking
        from experiences.models import Experience

        total_users = User.objects.filter(deleted_at__isnull=True).count()
        total_vendors = ProviderProfile.objects.count()
        pending_vendors = ProviderProfile.objects.filter(is_verified=False).count()
        total_experiences = Experience.objects.exclude(status='archived').count()
        pending_experiences = Experience.objects.filter(status='pending_review').count()
        total_bookings = Booking.objects.count()
        total_revenue = Booking.objects.exclude(
            status__in=['cancelled_by_participant', 'cancelled_by_provider', 'refunded']
        ).aggregate(total=Sum('total_price'))['total'] or 0

        return Response({
            'total_users': total_users,
            'total_vendors': total_vendors,
            'pending_vendors': pending_vendors,
            'total_experiences': total_experiences,
            'pending_experiences': pending_experiences,
            'total_bookings': total_bookings,
            'total_revenue': str(total_revenue),
        })
