from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    Organisation, OrganisationMember, OrganisationInvite,
    Department, Team, TeamMember, BudgetTransaction,
    Poll, PollOption, PollVote,
    ExperienceSuggestion,
)

User = get_user_model()


# ─── Organisation ────────────────────────────────────────────────────────────

class OrganisationSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organisation
        fields = [
            'id', 'name', 'domain', 'billing_email', 'billing_address',
            'logo_url', 'max_users', 'subscription_tier', 'member_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'member_count', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()


class OrganisationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organisation
        fields = ['name', 'domain', 'billing_email', 'billing_address', 'logo_url']

    def create(self, validated_data):
        org = Organisation.objects.create(**validated_data)
        # Auto-add the creating user as org admin
        user = self.context['request'].user
        OrganisationMember.objects.create(org=org, user=user, role='admin')
        user.org = org
        user.save(update_fields=['org'])
        return org


class OrganisationMemberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    avatar_url = serializers.URLField(source='user.avatar_url', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = OrganisationMember
        fields = [
            'id', 'user_id', 'email', 'first_name', 'last_name', 'avatar_url',
            'user_role', 'role', 'joined_at', 'created_at',
        ]
        read_only_fields = ['id', 'joined_at', 'created_at']


# ─── Invite ──────────────────────────────────────────────────────────────────

class TeamInviteSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, default='')
    target_role = serializers.ChoiceField(
        choices=OrganisationMember.ROLE_CHOICES, default='member'
    )
    target_department_id = serializers.IntegerField(required=False, allow_null=True)
    target_team_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_email(self, value):
        if not value:
            return value
        org = self.context['org']
        if OrganisationMember.objects.filter(org=org, user__email__iexact=value).exists():
            raise serializers.ValidationError('This person is already a member of your organisation.')
        if OrganisationInvite.objects.filter(
            org=org, email__iexact=value, accepted_at__isnull=True
        ).exists():
            raise serializers.ValidationError('An invitation has already been sent to this email.')
        return value

    def validate_target_department_id(self, value):
        if value is None:
            return value
        org = self.context['org']
        if not Department.objects.filter(id=value, org=org).exists():
            raise serializers.ValidationError('Department not found in your organisation.')
        return value

    def validate_target_team_id(self, value):
        if value is None:
            return value
        org = self.context['org']
        if not Team.objects.filter(id=value, department__org=org).exists():
            raise serializers.ValidationError('Team not found in your organisation.')
        return value

    def validate(self, data):
        if data.get('target_role') == 'dept_head' and not data.get('target_department_id'):
            raise serializers.ValidationError(
                {'target_department_id': 'Department is required when inviting a dept head.'}
            )
        return data


# ─── Department ──────────────────────────────────────────────────────────────

class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'avatar_url']
        read_only_fields = fields


class DepartmentSerializer(serializers.ModelSerializer):
    head_detail = UserMinimalSerializer(source='head', read_only=True)
    budget_remaining = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    monthly_budget = serializers.DecimalField(
        max_digits=10, decimal_places=2
    )
    current_month_spent = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    monthly_budget_remaining = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    days_until_reset = serializers.IntegerField(read_only=True)
    budget_period_label = serializers.CharField(read_only=True)
    team_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 'name', 'head', 'head_detail',
            'budget_total', 'budget_spent', 'budget_remaining',
            'monthly_budget', 'current_month_spent', 'monthly_budget_remaining',
            'days_until_reset', 'budget_period_label',
            'budget_period_start', 'budget_period_end',
            'team_count', 'member_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'budget_spent', 'created_at', 'updated_at']

    def get_team_count(self, obj):
        return obj.teams.count()

    def get_member_count(self, obj):
        return TeamMember.objects.filter(team__department=obj).count()


class DepartmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['name', 'head', 'budget_total', 'monthly_budget', 'budget_period_start', 'budget_period_end']

    def validate_head(self, value):
        if value is None:
            return value
        org = self.context['org']
        if not OrganisationMember.objects.filter(org=org, user=value).exists():
            raise serializers.ValidationError('User is not a member of this organisation.')
        return value


# ─── Team ────────────────────────────────────────────────────────────────────

class TeamMemberSerializer(serializers.ModelSerializer):
    user_detail = UserMinimalSerializer(source='user', read_only=True)

    class Meta:
        model = TeamMember
        fields = ['id', 'user', 'user_detail', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class TeamSerializer(serializers.ModelSerializer):
    members = TeamMemberSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['id', 'name', 'department', 'members', 'member_count', 'created_at']
        read_only_fields = ['id', 'department', 'created_at']

    def get_member_count(self, obj):
        return obj.members.count()


class TeamCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)

    def validate_name(self, value):
        department = self.context['department']
        if Team.objects.filter(department=department, name=value).exists():
            raise serializers.ValidationError('A team with this name already exists in this department.')
        return value


# ─── Budget ──────────────────────────────────────────────────────────────────

class BudgetTransactionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    booking_reference = serializers.CharField(
        source='booking.booking_reference', read_only=True, default=None
    )

    class Meta:
        model = BudgetTransaction
        fields = [
            'id', 'type', 'amount', 'booking', 'booking_reference',
            'note', 'created_by', 'created_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f'{obj.created_by.first_name} {obj.created_by.last_name}'
        return None


class BudgetAdjustSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    note = serializers.CharField(required=False, default='')


# ─── Poll ────────────────────────────────────────────────────────────────────

class PollOptionSerializer(serializers.ModelSerializer):
    vote_count = serializers.SerializerMethodField()
    voted_by_me = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ['id', 'label', 'experience', 'date', 'vote_count', 'voted_by_me']
        read_only_fields = ['id']

    def get_vote_count(self, obj):
        return obj.votes.count()

    def get_voted_by_me(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.votes.filter(user=request.user).exists()


class PollSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    total_votes = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = [
            'id', 'title', 'type', 'status', 'team',
            'created_by', 'created_by_name',
            'options', 'total_votes',
            'closes_at', 'created_at',
        ]
        read_only_fields = ['id', 'team', 'created_by', 'status', 'created_at']

    def get_created_by_name(self, obj):
        return f'{obj.created_by.first_name} {obj.created_by.last_name}'

    def get_total_votes(self, obj):
        return PollVote.objects.filter(option__poll=obj).count()


class PollCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300)
    type = serializers.ChoiceField(choices=Poll.TYPE_CHOICES)
    closes_at = serializers.DateTimeField(required=False, allow_null=True)
    options = serializers.ListField(
        child=serializers.DictField(), min_length=2, max_length=20
    )

    def validate_options(self, value):
        for opt in value:
            if 'label' not in opt:
                raise serializers.ValidationError('Each option must have a "label" field.')
        return value


class PollVoteSerializer(serializers.Serializer):
    option_ids = serializers.ListField(
        child=serializers.IntegerField(), min_length=1
    )


# ─── Suggestions ─────────────────────────────────────────────────────────────

class ExperienceSuggestionSerializer(serializers.ModelSerializer):
    suggested_by_detail = UserMinimalSerializer(source='suggested_by', read_only=True)
    upvote_count = serializers.SerializerMethodField()
    upvoted_by_me = serializers.SerializerMethodField()
    experience_title = serializers.CharField(source='experience.title', read_only=True)
    experience_slug = serializers.CharField(source='experience.slug', read_only=True)
    experience_cover_image = serializers.URLField(
        source='experience.cover_image', read_only=True, default=None
    )
    experience_price = serializers.DecimalField(
        source='experience.price_per_person', max_digits=8, decimal_places=2, read_only=True
    )

    class Meta:
        model = ExperienceSuggestion
        fields = [
            'id', 'team', 'experience', 'experience_title', 'experience_slug',
            'experience_cover_image', 'experience_price',
            'suggested_by', 'suggested_by_detail', 'message',
            'upvote_count', 'upvoted_by_me', 'created_at',
        ]
        read_only_fields = ['id', 'team', 'suggested_by', 'created_at']

    def get_upvote_count(self, obj):
        return obj.upvotes.count()

    def get_upvoted_by_me(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.upvotes.filter(user=request.user).exists()


class SuggestionCreateSerializer(serializers.Serializer):
    experience_id = serializers.IntegerField()
    message = serializers.CharField(required=False, default='')

    def validate_experience_id(self, value):
        from experiences.models import Experience
        if not Experience.objects.filter(id=value, status='published').exists():
            raise serializers.ValidationError('Experience not found or not published.')
        return value
