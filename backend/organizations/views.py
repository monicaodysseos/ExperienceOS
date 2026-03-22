import secrets
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Sum, Q, F
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Organisation, OrganisationMember, OrganisationInvite,
    Department, Team, TeamMember, BudgetTransaction,
    Poll, PollOption, PollVote,
    ExperienceSuggestion, SuggestionUpvote,
)
from .serializers import (
    OrganisationSerializer,
    OrganisationCreateSerializer,
    OrganisationMemberSerializer,
    TeamInviteSerializer,
    DepartmentSerializer,
    DepartmentCreateSerializer,
    TeamSerializer,
    TeamCreateSerializer,
    TeamMemberSerializer,
    BudgetTransactionSerializer,
    BudgetAdjustSerializer,
    PollSerializer,
    PollCreateSerializer,
    PollVoteSerializer,
    ExperienceSuggestionSerializer,
    SuggestionCreateSerializer,
)
from .tasks import send_team_invite_email

User = get_user_model()


# ─── Permission Classes ─────────────────────────────────────────────────────

class IsOrgAdmin(permissions.BasePermission):
    """User must be an admin member of their organisation."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.org_id:
            return False
        # Check OrganisationMember role
        if OrganisationMember.objects.filter(
            org=request.user.org, user=request.user, role='admin'
        ).exists():
            return True
        # Fallback: HR managers who are org members are treated as admins
        if request.user.role == 'hr_manager' and OrganisationMember.objects.filter(
            org=request.user.org, user=request.user
        ).exists():
            return True
        return False


class IsOrgMember(permissions.BasePermission):
    """User must belong to an organisation."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.org_id is not None


class IsOrgDeptHead(permissions.BasePermission):
    """User must be a dept head in their org."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.org_id:
            return False
        return OrganisationMember.objects.filter(
            org=request.user.org, user=request.user, role='dept_head'
        ).exists()


class IsOrgAdminOrDeptHead(permissions.BasePermission):
    """User must be admin or dept head."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.org_id:
            return False
        # Check OrganisationMember role
        if OrganisationMember.objects.filter(
            org=request.user.org, user=request.user, role__in=['admin', 'dept_head']
        ).exists():
            return True
        # Fallback: check User model role for hr_manager or dept_head
        if request.user.role in ('hr_manager', 'dept_head') and OrganisationMember.objects.filter(
            org=request.user.org, user=request.user
        ).exists():
            return True
        return False


# ─── Organisation CRUD ───────────────────────────────────────────────────────

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


# ─── Team Members & Invites ─────────────────────────────────────────────────

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
    permission_classes = [IsOrgAdminOrDeptHead]

    def post(self, request):
        org = request.user.org
        serializer = TeamInviteSerializer(data=request.data, context={'org': org})
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        target_role = serializer.validated_data.get('target_role', 'member')
        target_department_id = serializer.validated_data.get('target_department_id')
        target_team_id = serializer.validated_data.get('target_team_id')

        target_department = None
        target_team = None
        if target_department_id:
            target_department = Department.objects.get(id=target_department_id, org=org)
        if target_team_id:
            target_team = Team.objects.get(id=target_team_id, department__org=org)

        # Check if user already exists — add directly
        try:
            invitee = User.objects.get(email__iexact=email)
            OrganisationMember.objects.create(
                org=org, user=invitee, role=target_role,
                invited_by=request.user, joined_at=timezone.now()
            )
            invitee.org = org
            if target_role == 'dept_head':
                invitee.role = 'dept_head'
            elif target_role == 'member':
                invitee.role = 'employee'
            invitee.save(update_fields=['org', 'role'])

            # Assign to department/team
            if target_department and target_role == 'dept_head':
                target_department.head = invitee
                target_department.save(update_fields=['head'])
            if target_team:
                TeamMember.objects.get_or_create(team=target_team, user=invitee)

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
            target_role=target_role,
            target_department=target_department,
            target_team=target_team,
            expires_at=timezone.now() + timedelta(days=7),
        )
        send_team_invite_email.delay(invite.id)
        invite_url = f"{settings.FRONTEND_URL}/join?code={invite.short_code}"
        return Response(
            {
                'detail': f'Invitation sent to {email}.',
                'short_code': invite.short_code,
                'invite_url': invite_url,
            },
            status=status.HTTP_201_CREATED
        )


class AcceptInviteView(APIView):
    """Accept an org invite by token or short_code — called after user registers."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        short_code = request.data.get('short_code')
        if not token and not short_code:
            return Response({'detail': 'Token or short_code is required.'}, status=400)

        try:
            if token:
                invite = OrganisationInvite.objects.get(
                    token=token, accepted_at__isnull=True
                )
            else:
                invite = OrganisationInvite.objects.get(
                    short_code=short_code.upper().strip(), accepted_at__isnull=True
                )
        except OrganisationInvite.DoesNotExist:
            return Response({'detail': 'Invalid or expired invitation.'}, status=400)

        if invite.expires_at < timezone.now():
            return Response({'detail': 'This invitation has expired.'}, status=400)

        # Only enforce email match for direct token invites (email-specific)
        # Short code invites are shareable — anyone can use them
        if token and invite.email.lower() != request.user.email.lower():
            return Response({'detail': 'This invitation was sent to a different email.'}, status=403)

        # Accept invite
        OrganisationMember.objects.get_or_create(
            org=invite.org, user=request.user,
            defaults={
                'role': invite.target_role,
                'invited_by': invite.invited_by,
                'joined_at': timezone.now(),
            }
        )
        request.user.org = invite.org
        if invite.target_role == 'dept_head':
            request.user.role = 'dept_head'
        elif invite.target_role == 'member':
            request.user.role = 'employee'
        request.user.save(update_fields=['org', 'role'])

        # Assign to department/team based on invite
        if invite.target_department and invite.target_role == 'dept_head':
            invite.target_department.head = request.user
            invite.target_department.save(update_fields=['head'])
        if invite.target_team:
            TeamMember.objects.get_or_create(
                team=invite.target_team, user=request.user
            )

        invite.accepted_at = timezone.now()
        invite.save(update_fields=['accepted_at'])

        return Response(OrganisationSerializer(invite.org).data)


class LookupInviteView(APIView):
    """Public endpoint: look up an invite by short_code to preview org info."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        code = request.query_params.get('code', '').upper().strip()
        if not code:
            return Response({'detail': 'Code is required.'}, status=400)

        try:
            invite = OrganisationInvite.objects.select_related('org').get(
                short_code=code, accepted_at__isnull=True
            )
        except OrganisationInvite.DoesNotExist:
            return Response({'detail': 'Invalid or expired invite code.'}, status=404)

        if invite.expires_at < timezone.now():
            return Response({'detail': 'This invite code has expired.'}, status=400)

        return Response({
            'org_name': invite.org.name,
            'org_logo': invite.org.logo_url or '',
            'target_role': invite.target_role,
            'short_code': invite.short_code,
            'email': invite.email,
            'expires_at': invite.expires_at.isoformat(),
        })


# ─── Department CRUD (HR Admin only) ────────────────────────────────────────

class DepartmentListCreateView(APIView):
    """List/Create departments for the org."""
    permission_classes = [IsOrgAdmin]

    def get(self, request):
        departments = Department.objects.filter(
            org=request.user.org
        ).select_related('head')
        serializer = DepartmentSerializer(departments, many=True)
        return Response({'results': serializer.data, 'count': len(serializer.data)})

    def post(self, request):
        serializer = DepartmentCreateSerializer(
            data=request.data, context={'org': request.user.org}
        )
        serializer.is_valid(raise_exception=True)
        dept = serializer.save(org=request.user.org)

        # If budget > 0, create initial allocation transaction
        if dept.budget_total > 0:
            BudgetTransaction.objects.create(
                department=dept,
                type='allocation',
                amount=dept.budget_total,
                note='Initial budget allocation',
                created_by=request.user,
            )

        # If head is assigned, update their org membership role
        if dept.head:
            OrganisationMember.objects.filter(
                org=request.user.org, user=dept.head
            ).update(role='dept_head')
            if dept.head.role != 'dept_head':
                dept.head.role = 'dept_head'
                dept.head.save(update_fields=['role'])

        return Response(
            DepartmentSerializer(dept).data,
            status=status.HTTP_201_CREATED
        )


class DepartmentDetailView(APIView):
    """Get/Update/Delete a department."""
    permission_classes = [IsOrgAdmin]

    def _get_dept(self, request, dept_id):
        try:
            return Department.objects.select_related('head').get(
                id=dept_id, org=request.user.org
            )
        except Department.DoesNotExist:
            return None

    def get(self, request, dept_id):
        dept = self._get_dept(request, dept_id)
        if not dept:
            return Response({'detail': 'Department not found.'}, status=404)
        return Response(DepartmentSerializer(dept).data)

    def patch(self, request, dept_id):
        dept = self._get_dept(request, dept_id)
        if not dept:
            return Response({'detail': 'Department not found.'}, status=404)
        serializer = DepartmentCreateSerializer(
            dept, data=request.data, partial=True,
            context={'org': request.user.org}
        )
        serializer.is_valid(raise_exception=True)
        dept = serializer.save()

        # If head changed, update their membership role
        if 'head' in request.data and dept.head:
            OrganisationMember.objects.filter(
                org=request.user.org, user=dept.head
            ).update(role='dept_head')
            if dept.head.role != 'dept_head':
                dept.head.role = 'dept_head'
                dept.head.save(update_fields=['role'])

        return Response(DepartmentSerializer(dept).data)

    def delete(self, request, dept_id):
        dept = self._get_dept(request, dept_id)
        if not dept:
            return Response({'detail': 'Department not found.'}, status=404)
        dept.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Budget ──────────────────────────────────────────────────────────────────

class DepartmentBudgetView(APIView):
    """Add/adjust budget for a department (HR Admin)."""
    permission_classes = [IsOrgAdmin]

    def post(self, request, dept_id):
        try:
            dept = Department.objects.get(id=dept_id, org=request.user.org)
        except Department.DoesNotExist:
            return Response({'detail': 'Department not found.'}, status=404)

        serializer = BudgetAdjustSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data['amount']
        note = serializer.validated_data.get('note', '')

        with transaction.atomic():
            Department.objects.filter(id=dept.id).update(
                budget_total=F('budget_total') + amount
            )
            BudgetTransaction.objects.create(
                department=dept,
                type='allocation',
                amount=amount,
                note=note,
                created_by=request.user,
            )

        dept.refresh_from_db()
        return Response(DepartmentSerializer(dept).data)


class DepartmentTransactionsView(APIView):
    """List budget transactions for a department."""
    permission_classes = [IsOrgAdminOrDeptHead]

    def get(self, request, dept_id):
        try:
            dept = Department.objects.get(id=dept_id, org=request.user.org)
        except Department.DoesNotExist:
            return Response({'detail': 'Department not found.'}, status=404)

        # Dept heads can only see their own departments
        membership = OrganisationMember.objects.filter(
            org=request.user.org, user=request.user
        ).first()
        if membership and membership.role == 'dept_head' and dept.head != request.user:
            return Response({'detail': 'Not your department.'}, status=403)

        txns = BudgetTransaction.objects.filter(
            department=dept
        ).select_related('created_by', 'booking')
        serializer = BudgetTransactionSerializer(txns, many=True)
        return Response({'results': serializer.data, 'count': len(serializer.data)})


# ─── Team CRUD (Dept Head) ──────────────────────────────────────────────────

class TeamListCreateView(APIView):
    """List/Create teams in a department."""
    permission_classes = [IsOrgAdminOrDeptHead]

    def _get_dept(self, request, dept_id):
        try:
            dept = Department.objects.get(id=dept_id, org=request.user.org)
        except Department.DoesNotExist:
            return None
        # Dept heads can only manage their own department
        membership = OrganisationMember.objects.filter(
            org=request.user.org, user=request.user
        ).first()
        if membership and membership.role == 'dept_head' and dept.head != request.user:
            return None
        return dept

    def get(self, request, dept_id):
        dept = self._get_dept(request, dept_id)
        if not dept:
            return Response({'detail': 'Department not found.'}, status=404)
        teams = Team.objects.filter(department=dept).prefetch_related('members__user')
        serializer = TeamSerializer(teams, many=True)
        return Response({'results': serializer.data, 'count': len(serializer.data)})

    def post(self, request, dept_id):
        dept = self._get_dept(request, dept_id)
        if not dept:
            return Response({'detail': 'Department not found.'}, status=404)
        serializer = TeamCreateSerializer(data=request.data, context={'department': dept})
        serializer.is_valid(raise_exception=True)
        team = Team.objects.create(
            department=dept,
            name=serializer.validated_data['name'],
            created_by=request.user,
        )
        return Response(TeamSerializer(team).data, status=status.HTTP_201_CREATED)


class TeamDetailView(APIView):
    """Get/Update/Delete a team."""
    permission_classes = [IsOrgAdminOrDeptHead]

    def _get_team(self, request, dept_id, team_id):
        try:
            team = Team.objects.select_related('department').get(
                id=team_id, department_id=dept_id, department__org=request.user.org
            )
        except Team.DoesNotExist:
            return None
        membership = OrganisationMember.objects.filter(
            org=request.user.org, user=request.user
        ).first()
        if membership and membership.role == 'dept_head' and team.department.head != request.user:
            return None
        return team

    def get(self, request, dept_id, team_id):
        team = self._get_team(request, dept_id, team_id)
        if not team:
            return Response({'detail': 'Team not found.'}, status=404)
        return Response(TeamSerializer(team).data)

    def patch(self, request, dept_id, team_id):
        team = self._get_team(request, dept_id, team_id)
        if not team:
            return Response({'detail': 'Team not found.'}, status=404)
        name = request.data.get('name')
        if name:
            if Team.objects.filter(department=team.department, name=name).exclude(id=team.id).exists():
                return Response({'detail': 'A team with this name already exists.'}, status=400)
            team.name = name
            team.save(update_fields=['name'])
        return Response(TeamSerializer(team).data)

    def delete(self, request, dept_id, team_id):
        team = self._get_team(request, dept_id, team_id)
        if not team:
            return Response({'detail': 'Team not found.'}, status=404)
        team.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeamMemberAddView(APIView):
    """Add a member to a team."""
    permission_classes = [IsOrgAdminOrDeptHead]

    def post(self, request, dept_id, team_id):
        try:
            team = Team.objects.get(
                id=team_id, department_id=dept_id, department__org=request.user.org
            )
        except Team.DoesNotExist:
            return Response({'detail': 'Team not found.'}, status=404)

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id is required.'}, status=400)

        try:
            user = User.objects.get(id=user_id, org=request.user.org)
        except User.DoesNotExist:
            return Response({'detail': 'User not found in your organisation.'}, status=404)

        _, created = TeamMember.objects.get_or_create(team=team, user=user)
        if not created:
            return Response({'detail': 'User is already a member of this team.'}, status=400)

        return Response(
            TeamMemberSerializer(TeamMember.objects.get(team=team, user=user)).data,
            status=status.HTTP_201_CREATED
        )


class TeamMemberRemoveView(APIView):
    """Remove a member from a team."""
    permission_classes = [IsOrgAdminOrDeptHead]

    def delete(self, request, dept_id, team_id, user_id):
        try:
            tm = TeamMember.objects.get(
                team_id=team_id, user_id=user_id,
                team__department_id=dept_id,
                team__department__org=request.user.org,
            )
        except TeamMember.DoesNotExist:
            return Response({'detail': 'Team member not found.'}, status=404)
        tm.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Department Head Booking ─────────────────────────────────────────────────

class DeptBookingView(APIView):
    """Book an experience using department budget."""
    permission_classes = [IsOrgDeptHead]

    def post(self, request, dept_id):
        from bookings.models import TimeSlot, Booking
        from django.conf import settings as django_settings

        try:
            dept = Department.objects.get(id=dept_id, org=request.user.org, head=request.user)
        except Department.DoesNotExist:
            return Response({'detail': 'Department not found or not yours.'}, status=404)

        time_slot_id = request.data.get('time_slot_id')
        num_participants = int(request.data.get('num_participants', 1))
        team_id = request.data.get('team_id')
        special_requests = request.data.get('special_requests', '')

        try:
            slot = TimeSlot.objects.select_related('experience').get(
                id=time_slot_id, is_active=True
            )
        except TimeSlot.DoesNotExist:
            return Response({'detail': 'Time slot not found.'}, status=400)

        if slot.start_datetime <= timezone.now():
            return Response({'detail': 'Time slot has passed.'}, status=400)
        if num_participants > slot.spots_remaining:
            return Response({'detail': f'Only {slot.spots_remaining} spots remaining.'}, status=400)

        experience = slot.experience
        unit_price = experience.price_per_person
        total_price = unit_price * num_participants
        commission_rate = Decimal(str(django_settings.PLATFORM_COMMISSION_RATE))
        service_fee_rate = Decimal(str(django_settings.PARTICIPANT_SERVICE_FEE_RATE))
        platform_fee = (total_price * commission_rate).quantize(Decimal('0.01'))
        provider_payout = total_price - platform_fee
        participant_service_fee = (total_price * service_fee_rate).quantize(Decimal('0.01'))

        # Check budget
        if dept.budget_remaining < total_price:
            return Response(
                {'detail': f'Insufficient budget. Available: {dept.budget_remaining}, Required: {total_price}'},
                status=400
            )

        team = None
        if team_id:
            try:
                team = Team.objects.get(id=team_id, department=dept)
            except Team.DoesNotExist:
                return Response({'detail': 'Team not found in this department.'}, status=400)

        with transaction.atomic():
            # Deduct budget atomically
            updated = Department.objects.filter(
                id=dept.id, budget_spent__lte=F('budget_total') - total_price
            ).update(budget_spent=F('budget_spent') + total_price)

            if not updated:
                return Response({'detail': 'Insufficient budget (concurrent update).'}, status=400)

            # Reduce spots
            slot.spots_remaining -= num_participants
            slot.save(update_fields=['spots_remaining'])

            # Create booking
            booking = Booking.objects.create(
                participant=request.user,
                org=request.user.org,
                department=dept,
                team=team,
                booked_by=request.user,
                time_slot=slot,
                experience=experience,
                num_participants=num_participants,
                unit_price=unit_price,
                total_price=total_price,
                platform_fee=platform_fee,
                provider_payout=provider_payout,
                participant_service_fee=participant_service_fee,
                special_requests=special_requests,
            )

            # Record budget transaction
            BudgetTransaction.objects.create(
                department=dept,
                type='booking',
                amount=-total_price,
                booking=booking,
                note=f'Booking {booking.booking_reference}: {experience.title}',
                created_by=request.user,
            )

        from bookings.serializers import BookingSerializer
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


# ─── Polls ───────────────────────────────────────────────────────────────────

def _can_access_team(request, team_id):
    """Check if user can access a team (member, dept head, or admin)."""
    membership = OrganisationMember.objects.filter(
        org=request.user.org, user=request.user
    ).first()
    if not membership:
        return False
    if membership.role in ['admin', 'dept_head']:
        return Team.objects.filter(id=team_id, department__org=request.user.org).exists()
    return TeamMember.objects.filter(team_id=team_id, user=request.user).exists()


class PollListCreateView(APIView):
    """List/Create polls for a team."""
    permission_classes = [IsOrgMember]

    def get(self, request, team_id):
        if not _can_access_team(request, team_id):
            return Response({'detail': 'Access denied.'}, status=403)
        polls = Poll.objects.filter(team_id=team_id).select_related(
            'created_by'
        ).prefetch_related('options__votes')
        serializer = PollSerializer(polls, many=True, context={'request': request})
        return Response({'results': serializer.data, 'count': len(serializer.data)})

    def post(self, request, team_id):
        # Only dept heads and admins can create polls
        membership = OrganisationMember.objects.filter(
            org=request.user.org, user=request.user, role__in=['admin', 'dept_head']
        ).first()
        if not membership:
            return Response({'detail': 'Only dept heads and admins can create polls.'}, status=403)

        try:
            team = Team.objects.get(id=team_id, department__org=request.user.org)
        except Team.DoesNotExist:
            return Response({'detail': 'Team not found.'}, status=404)

        serializer = PollCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        poll = Poll.objects.create(
            team=team,
            title=data['title'],
            type=data['type'],
            closes_at=data.get('closes_at'),
            created_by=request.user,
        )

        for opt_data in data['options']:
            PollOption.objects.create(
                poll=poll,
                label=opt_data['label'],
                experience_id=opt_data.get('experience_id'),
                date=opt_data.get('date'),
            )

        return Response(
            PollSerializer(poll, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class PollDetailView(APIView):
    """Get poll detail with options and vote counts."""
    permission_classes = [IsOrgMember]

    def get(self, request, poll_id):
        try:
            poll = Poll.objects.select_related('created_by', 'team').prefetch_related(
                'options__votes'
            ).get(id=poll_id, team__department__org=request.user.org)
        except Poll.DoesNotExist:
            return Response({'detail': 'Poll not found.'}, status=404)
        return Response(PollSerializer(poll, context={'request': request}).data)


class PollVoteView(APIView):
    """Cast votes on poll options."""
    permission_classes = [IsOrgMember]

    def post(self, request, poll_id):
        try:
            poll = Poll.objects.get(
                id=poll_id, team__department__org=request.user.org, status='open'
            )
        except Poll.DoesNotExist:
            return Response({'detail': 'Poll not found or closed.'}, status=404)

        serializer = PollVoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        option_ids = serializer.validated_data['option_ids']

        # Verify options belong to this poll
        valid_options = PollOption.objects.filter(poll=poll, id__in=option_ids)
        if valid_options.count() != len(option_ids):
            return Response({'detail': 'One or more option IDs are invalid.'}, status=400)

        # Remove existing votes for this poll by this user, then add new ones
        PollVote.objects.filter(option__poll=poll, user=request.user).delete()
        for option in valid_options:
            PollVote.objects.create(option=option, user=request.user)

        poll.refresh_from_db()
        return Response(PollSerializer(poll, context={'request': request}).data)


class PollCloseView(APIView):
    """Close a poll (dept head/admin only)."""
    permission_classes = [IsOrgAdminOrDeptHead]

    def patch(self, request, poll_id):
        try:
            poll = Poll.objects.get(
                id=poll_id, team__department__org=request.user.org
            )
        except Poll.DoesNotExist:
            return Response({'detail': 'Poll not found.'}, status=404)

        poll.status = 'closed'
        poll.save(update_fields=['status'])
        return Response(PollSerializer(poll, context={'request': request}).data)


# ─── Suggestions ─────────────────────────────────────────────────────────────

class SuggestionListCreateView(APIView):
    """List/Create experience suggestions for a team."""
    permission_classes = [IsOrgMember]

    def get(self, request, team_id):
        if not _can_access_team(request, team_id):
            return Response({'detail': 'Access denied.'}, status=403)
        suggestions = ExperienceSuggestion.objects.filter(
            team_id=team_id
        ).select_related('experience', 'suggested_by').prefetch_related('upvotes')
        serializer = ExperienceSuggestionSerializer(
            suggestions, many=True, context={'request': request}
        )
        return Response({'results': serializer.data, 'count': len(serializer.data)})

    def post(self, request, team_id):
        if not _can_access_team(request, team_id):
            return Response({'detail': 'Access denied.'}, status=403)

        try:
            team = Team.objects.get(id=team_id, department__org=request.user.org)
        except Team.DoesNotExist:
            return Response({'detail': 'Team not found.'}, status=404)

        serializer = SuggestionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        suggestion, created = ExperienceSuggestion.objects.get_or_create(
            team=team,
            experience_id=serializer.validated_data['experience_id'],
            suggested_by=request.user,
            defaults={'message': serializer.validated_data.get('message', '')}
        )
        if not created:
            return Response({'detail': 'You already suggested this experience.'}, status=400)

        return Response(
            ExperienceSuggestionSerializer(suggestion, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class SuggestionUpvoteView(APIView):
    """Upvote/remove upvote on a suggestion."""
    permission_classes = [IsOrgMember]

    def post(self, request, suggestion_id):
        try:
            suggestion = ExperienceSuggestion.objects.get(
                id=suggestion_id, team__department__org=request.user.org
            )
        except ExperienceSuggestion.DoesNotExist:
            return Response({'detail': 'Suggestion not found.'}, status=404)

        _, created = SuggestionUpvote.objects.get_or_create(
            suggestion=suggestion, user=request.user
        )
        if not created:
            return Response({'detail': 'Already upvoted.'}, status=400)

        return Response(
            ExperienceSuggestionSerializer(suggestion, context={'request': request}).data
        )

    def delete(self, request, suggestion_id):
        deleted, _ = SuggestionUpvote.objects.filter(
            suggestion_id=suggestion_id, user=request.user
        ).delete()
        if not deleted:
            return Response({'detail': 'No upvote to remove.'}, status=400)

        suggestion = ExperienceSuggestion.objects.get(id=suggestion_id)
        return Response(
            ExperienceSuggestionSerializer(suggestion, context={'request': request}).data
        )


# ─── My Teams (Employee view) ───────────────────────────────────────────────

class MyTeamsView(APIView):
    """List teams the current user belongs to."""
    permission_classes = [IsOrgMember]

    def get(self, request):
        memberships = TeamMember.objects.filter(
            user=request.user
        ).select_related('team__department')
        teams = [m.team for m in memberships]
        serializer = TeamSerializer(teams, many=True)
        return Response({'results': serializer.data, 'count': len(serializer.data)})


# ─── Dept Head Dashboard ────────────────────────────────────────────────────

class DeptHeadDashboardView(APIView):
    """Dashboard summary for department heads."""
    permission_classes = [IsOrgDeptHead]

    def get(self, request):
        from bookings.models import Booking

        departments = Department.objects.filter(head=request.user, org=request.user.org)
        if not departments.exists():
            return Response({
                'departments': [],
                'total_budget': '0.00',
                'total_spent': '0.00',
                'total_remaining': '0.00',
                'team_count': 0,
                'member_count': 0,
                'active_polls': 0,
                'recent_bookings': [],
            })

        dept_data = DepartmentSerializer(departments, many=True).data
        total_budget = sum(d.budget_total for d in departments)
        total_spent = sum(d.budget_spent for d in departments)

        team_count = Team.objects.filter(department__in=departments).count()
        member_count = TeamMember.objects.filter(team__department__in=departments).count()
        active_polls = Poll.objects.filter(
            team__department__in=departments, status='open'
        ).count()

        recent_bookings = Booking.objects.filter(
            department__in=departments
        ).select_related('experience', 'time_slot').order_by('-created_at')[:5]

        from bookings.serializers import BookingSerializer
        recent_data = BookingSerializer(recent_bookings, many=True).data

        return Response({
            'departments': dept_data,
            'total_budget': str(total_budget),
            'total_spent': str(total_spent),
            'total_remaining': str(total_budget - total_spent),
            'team_count': team_count,
            'member_count': member_count,
            'active_polls': active_polls,
            'recent_bookings': recent_data,
        })


# ─── HR Dashboard Views ─────────────────────────────────────────────────────

class OrgDashboardView(APIView):
    """Summary stats for the HR dashboard."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from bookings.models import Booking
        if not request.user.org_id:
            return Response({
                'total_bookings': 0,
                'total_spend': '0.00',
                'upcoming_count': 0,
                'avg_per_head': '0.00',
                'ytd_spend': '0.00',
                'recent_bookings': [],
                'org': None,
                'departments': [],
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

        # Department summaries
        departments = Department.objects.filter(org=org).select_related('head')
        dept_data = DepartmentSerializer(departments, many=True).data

        return Response({
            'total_bookings': total_bookings,
            'total_spend': str(total_spend),
            'upcoming_count': upcoming_count,
            'avg_per_head': str(avg_per_head.quantize(Decimal('0.01'))),
            'ytd_spend': str(ytd_spend),
            'recent_bookings': recent_data,
            'org': OrganisationSerializer(org).data,
            'departments': dept_data,
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

        # Spend by department
        by_department = (
            qs.filter(department__isnull=False)
            .values('department__name', 'department__id')
            .annotate(spend=Sum('total_price'), count=Count('id'))
            .order_by('-spend')
        )
        dept_breakdown = [
            {'department': row['department__name'],
             'department_id': row['department__id'],
             'spend': str(row['spend'] or 0),
             'count': row['count']}
            for row in by_department
        ]

        # Budget utilization per department
        departments = Department.objects.filter(org=org)
        budget_utilization = [
            {
                'department': d.name,
                'department_id': d.id,
                'budget_total': str(d.budget_total),
                'budget_spent': str(d.budget_spent),
                'budget_remaining': str(d.budget_remaining),
                'utilization_pct': float(
                    (d.budget_spent / d.budget_total * 100) if d.budget_total > 0 else 0
                ),
            }
            for d in departments
        ]

        # Engagement: top voters
        top_voters = (
            PollVote.objects.filter(option__poll__team__department__org=org)
            .values('user__id', 'user__first_name', 'user__last_name')
            .annotate(vote_count=Count('id'))
            .order_by('-vote_count')[:10]
        )
        top_voters_data = [
            {
                'user_id': row['user__id'],
                'name': f"{row['user__first_name']} {row['user__last_name']}",
                'vote_count': row['vote_count'],
            }
            for row in top_voters
        ]

        # Most suggested experiences
        top_suggestions = (
            ExperienceSuggestion.objects.filter(team__department__org=org)
            .values('experience__title', 'experience__slug')
            .annotate(suggestion_count=Count('id'), upvote_count=Count('upvotes'))
            .order_by('-upvote_count')[:10]
        )
        top_suggestions_data = [
            {
                'title': row['experience__title'],
                'slug': row['experience__slug'],
                'suggestion_count': row['suggestion_count'],
                'upvote_count': row['upvote_count'],
            }
            for row in top_suggestions
        ]

        return Response({
            'category_breakdown': category_breakdown,
            'monthly_spend': monthly_spend,
            'top_experiences': top_exp_data,
            'department_breakdown': dept_breakdown,
            'budget_utilization': budget_utilization,
            'top_voters': top_voters_data,
            'top_suggestions': top_suggestions_data,
        })


class OrgBookingsView(generics.ListAPIView):
    """Paginated bookings list for the HR manager's organisation."""
    permission_classes = [IsOrgMember]

    def get_queryset(self):
        from bookings.models import Booking

        org = self.request.user.org
        qs = Booking.objects.filter(org=org).select_related(
            'experience', 'time_slot', 'participant', 'department', 'team'
        )

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        department_filter = self.request.query_params.get('department')
        if department_filter:
            qs = qs.filter(department_id=department_filter)

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
