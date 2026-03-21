import secrets
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Organisation, OrganisationMember, OrganisationInvite
from .serializers import (
    OrganisationSerializer,
    OrganisationCreateSerializer,
    OrganisationMemberSerializer,
    TeamInviteSerializer,
)
from .tasks import send_team_invite_email

User = get_user_model()


class IsOrgAdmin(permissions.BasePermission):
    """User must be an admin member of their organisation."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if not request.user.org_id:
            return False
        return OrganisationMember.objects.filter(
            org=request.user.org, user=request.user, role='admin'
        ).exists()


class OrgDetailView(APIView):
    """GET/PATCH the user's own organisation."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.org_id:
            return Response({'detail': 'You are not part of an organisation.'}, status=404)
        serializer = OrganisationSerializer(request.user.org)
        return Response(serializer.data)

    def patch(self, request):
        if not request.user.org_id:
            return Response({'detail': 'You are not part of an organisation.'}, status=404)
        if not OrganisationMember.objects.filter(
            org=request.user.org, user=request.user, role='admin'
        ).exists():
            return Response({'detail': 'Only org admins can update organisation details.'}, status=403)
        serializer = OrganisationSerializer(request.user.org, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class OrgCreateView(generics.CreateAPIView):
    """Create a new organisation — the creator becomes its admin."""
    serializer_class = OrganisationCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

    def create(self, request, *args, **kwargs):
        if request.user.org_id:
            return Response(
                {'detail': 'You are already a member of an organisation.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        org = serializer.save()
        return Response(OrganisationSerializer(org).data, status=status.HTTP_201_CREATED)


class TeamMembersView(APIView):
    """List team members of the user's organisation."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.org_id:
            return Response({'detail': 'You are not part of an organisation.'}, status=404)
        members = OrganisationMember.objects.filter(
            org=request.user.org
        ).select_related('user')
        serializer = OrganisationMemberSerializer(members, many=True)
        return Response({'results': serializer.data, 'count': members.count()})


class TeamInviteView(APIView):
    """Send an email invitation to join the organisation."""
    permission_classes = [IsOrgAdmin]

    def post(self, request):
        org = request.user.org
        serializer = TeamInviteSerializer(data=request.data, context={'org': org})
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        # Check if user already exists — add directly
        try:
            invitee = User.objects.get(email__iexact=email)
            OrganisationMember.objects.create(
                org=org, user=invitee, role='member',
                invited_by=request.user, joined_at=timezone.now()
            )
            invitee.org = org
            invitee.save(update_fields=['org'])
            return Response(
                {'detail': f'{email} has been added to your organisation.'},
                status=status.HTTP_201_CREATED
            )
        except User.DoesNotExist:
            pass

        # User doesn't exist — create invite token
        token = secrets.token_urlsafe(48)
        invite = OrganisationInvite.objects.create(
            org=org,
            email=email,
            invited_by=request.user,
            token=token,
            expires_at=timezone.now() + timedelta(days=7),
        )
        send_team_invite_email.delay(invite.id)
        return Response(
            {'detail': f'Invitation sent to {email}.'},
            status=status.HTTP_201_CREATED
        )


class AcceptInviteView(APIView):
    """Accept an org invite by token — called after user registers."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'detail': 'Token is required.'}, status=400)

        try:
            invite = OrganisationInvite.objects.get(
                token=token, accepted_at__isnull=True
            )
        except OrganisationInvite.DoesNotExist:
            return Response({'detail': 'Invalid or expired invitation.'}, status=400)

        if invite.expires_at < timezone.now():
            return Response({'detail': 'This invitation has expired.'}, status=400)

        if invite.email.lower() != request.user.email.lower():
            return Response({'detail': 'This invitation was sent to a different email.'}, status=403)

        # Accept invite
        OrganisationMember.objects.get_or_create(
            org=invite.org, user=request.user,
            defaults={'role': 'member', 'invited_by': invite.invited_by, 'joined_at': timezone.now()}
        )
        request.user.org = invite.org
        request.user.save(update_fields=['org'])
        invite.accepted_at = timezone.now()
        invite.save(update_fields=['accepted_at'])

        return Response(OrganisationSerializer(invite.org).data)


# ─── HR Dashboard Views ──────────────────────────────────────────────────────

class IsOrgMember(permissions.BasePermission):
    """User must belong to an organisation."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.org_id is not None


class OrgDashboardView(APIView):
    """Summary stats for the HR dashboard."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from bookings.models import Booking
        # Return empty stats when user has no org yet
        if not request.user.org_id:
            return Response({
                'total_bookings': 0,
                'total_spend': '0.00',
                'upcoming_count': 0,
                'avg_per_head': '0.00',
                'ytd_spend': '0.00',
                'recent_bookings': [],
                'org': None,
            })
        org = request.user.org
        now = timezone.now()
        year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

        bookings_qs = Booking.objects.filter(org=org)

        total_bookings = bookings_qs.count()

        total_spend_data = bookings_qs.exclude(
            status__in=['cancelled_by_participant', 'cancelled_by_provider', 'refunded']
        ).aggregate(total=Sum('total_price'))
        total_spend = total_spend_data['total'] or Decimal('0')

        upcoming_count = bookings_qs.filter(
            time_slot__start_datetime__gte=now,
            status__in=['pending', 'confirmed'],
        ).count()

        total_participants = bookings_qs.exclude(
            status__in=['cancelled_by_participant', 'cancelled_by_provider']
        ).aggregate(total=Sum('num_participants'))['total'] or 0

        avg_per_head = (total_spend / total_participants) if total_participants > 0 else Decimal('0')

        ytd_spend_data = bookings_qs.filter(
            created_at__gte=year_start
        ).exclude(
            status__in=['cancelled_by_participant', 'cancelled_by_provider', 'refunded']
        ).aggregate(total=Sum('total_price'))
        ytd_spend = ytd_spend_data['total'] or Decimal('0')

        recent_bookings = bookings_qs.select_related(
            'experience', 'time_slot'
        ).order_by('-created_at')[:5]

        from bookings.serializers import BookingSerializer
        recent_data = BookingSerializer(recent_bookings, many=True).data

        return Response({
            'total_bookings': total_bookings,
            'total_spend': str(total_spend),
            'upcoming_count': upcoming_count,
            'avg_per_head': str(avg_per_head.quantize(Decimal('0.01'))),
            'ytd_spend': str(ytd_spend),
            'recent_bookings': recent_data,
            'org': OrganisationSerializer(org).data,
        })


class OrgAnalyticsView(APIView):
    """Spend analytics for the HR dashboard."""
    permission_classes = [IsOrgMember]

    def get(self, request):
        from bookings.models import Booking
        from django.db.models.functions import TruncMonth
        org = request.user.org

        active_statuses = ['pending', 'confirmed', 'completed']
        qs = Booking.objects.filter(org=org, status__in=active_statuses)

        # Spend by category
        by_category = (
            qs.values('experience__category__name')
            .annotate(spend=Sum('total_price'), count=Count('id'))
            .order_by('-spend')
        )
        category_breakdown = [
            {'category': row['experience__category__name'] or 'Uncategorised',
             'spend': str(row['spend'] or 0),
             'count': row['count']}
            for row in by_category
        ]

        # Monthly spend (last 12 months)
        from dateutil.relativedelta import relativedelta
        twelve_months_ago = timezone.now() - relativedelta(months=12)
        monthly = (
            qs.filter(created_at__gte=twelve_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(spend=Sum('total_price'), count=Count('id'))
            .order_by('month')
        )
        monthly_spend = [
            {'month': row['month'].strftime('%Y-%m'),
             'spend': str(row['spend'] or 0),
             'count': row['count']}
            for row in monthly
        ]

        # Top experiences
        top_experiences = (
            qs.values('experience__title', 'experience__slug')
            .annotate(spend=Sum('total_price'), count=Count('id'))
            .order_by('-spend')[:5]
        )
        top_exp_data = [
            {'title': row['experience__title'],
             'slug': row['experience__slug'],
             'spend': str(row['spend'] or 0),
             'count': row['count']}
            for row in top_experiences
        ]

        return Response({
            'category_breakdown': category_breakdown,
            'monthly_spend': monthly_spend,
            'top_experiences': top_exp_data,
        })


class OrgBookingsView(generics.ListAPIView):
    """Paginated bookings list for the HR manager's organisation."""
    permission_classes = [IsOrgMember]

    def get_queryset(self):
        from bookings.models import Booking
        from bookings.serializers import BookingSerializer
        self.serializer_class = BookingSerializer

        org = self.request.user.org
        qs = Booking.objects.filter(org=org).select_related('experience', 'time_slot', 'participant')

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        search = self.request.query_params.get('q')
        if search:
            qs = qs.filter(
                Q(booking_reference__icontains=search) |
                Q(experience__title__icontains=search)
            )

        return qs.order_by('-created_at')

    def get_serializer_class(self):
        from bookings.serializers import BookingSerializer
        return BookingSerializer
