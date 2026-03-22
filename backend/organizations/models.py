import secrets
import string

from django.conf import settings
from django.db import models


def _generate_short_code(length=8):
    """Generate a human-readable invite code like 'VIVI-A3K9'."""
    chars = string.ascii_uppercase + string.digits
    # Remove confusing chars: 0/O, 1/I/L
    chars = chars.replace('O', '').replace('0', '').replace('I', '').replace('1', '').replace('L', '')
    part1 = ''.join(secrets.choice(chars) for _ in range(4))
    part2 = ''.join(secrets.choice(chars) for _ in range(4))
    return f'{part1}-{part2}'


class Organisation(models.Model):
    SUBSCRIPTION_TIER_CHOICES = [
        ('free', 'Free'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
    ]

    name = models.CharField(max_length=200)
    domain = models.CharField(max_length=100, blank=True, db_index=True,
                               help_text='Company email domain, e.g. "company.com"')
    billing_email = models.EmailField()
    billing_address = models.JSONField(
        null=True, blank=True,
        help_text='{"street", "city", "country", "postcode", "vat_number"}'
    )
    logo_url = models.URLField(blank=True)
    max_users = models.PositiveIntegerField(default=50)
    subscription_tier = models.CharField(
        max_length=20, choices=SUBSCRIPTION_TIER_CHOICES, default='free'
    )
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'organisations'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def is_deleted(self):
        return self.deleted_at is not None


class OrganisationMember(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('dept_head', 'Dept Head'),
        ('member', 'Member'),
    ]

    org = models.ForeignKey(
        Organisation, on_delete=models.CASCADE, related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='org_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='sent_invitations'
    )
    joined_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'organisation_members'
        unique_together = [('org', 'user')]
        indexes = [
            models.Index(fields=['org', 'role']),
        ]

    def __str__(self):
        return f'{self.user.email} @ {self.org.name}'


class Department(models.Model):
    org = models.ForeignKey(
        Organisation, on_delete=models.CASCADE, related_name='departments'
    )
    name = models.CharField(max_length=200)
    head = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='headed_departments'
    )
    budget_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    budget_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    budget_period_start = models.DateField(null=True, blank=True)
    budget_period_end = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'
        unique_together = [('org', 'name')]
        ordering = ['name']

    def __str__(self):
        return f'{self.name} @ {self.org.name}'

    @property
    def budget_remaining(self):
        return self.budget_total - self.budget_spent


class Team(models.Model):
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name='teams'
    )
    name = models.CharField(max_length=200)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_teams'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'teams'
        unique_together = [('department', 'name')]
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.department.name})'


class TeamMember(models.Model):
    team = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='team_memberships'
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'team_members'
        unique_together = [('team', 'user')]

    def __str__(self):
        return f'{self.user.email} in {self.team.name}'


class BudgetTransaction(models.Model):
    TYPE_CHOICES = [
        ('allocation', 'Allocation'),
        ('booking', 'Booking Spend'),
        ('refund', 'Refund'),
        ('adjustment', 'Manual Adjustment'),
    ]

    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name='transactions'
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    booking = models.ForeignKey(
        'bookings.Booking', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='budget_transactions'
    )
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='budget_transactions_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'budget_transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.type}: {self.amount} ({self.department.name})'


class Poll(models.Model):
    TYPE_CHOICES = [
        ('date', 'Date Poll'),
        ('experience', 'Experience Poll'),
    ]
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
    ]

    team = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name='polls'
    )
    title = models.CharField(max_length=300)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='polls_created'
    )
    closes_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'polls'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.team.name})'


class PollOption(models.Model):
    poll = models.ForeignKey(
        Poll, on_delete=models.CASCADE, related_name='options'
    )
    label = models.CharField(max_length=300)
    experience = models.ForeignKey(
        'experiences.Experience', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='poll_options'
    )
    date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'poll_options'

    def __str__(self):
        return f'{self.label} (Poll: {self.poll.title})'


class PollVote(models.Model):
    option = models.ForeignKey(
        PollOption, on_delete=models.CASCADE, related_name='votes'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='poll_votes'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'poll_votes'
        unique_together = [('option', 'user')]

    def __str__(self):
        return f'{self.user.email} → {self.option.label}'


class ExperienceSuggestion(models.Model):
    team = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name='suggestions'
    )
    experience = models.ForeignKey(
        'experiences.Experience', on_delete=models.CASCADE,
        related_name='suggestions'
    )
    suggested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='experience_suggestions'
    )
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'experience_suggestions'
        unique_together = [('team', 'experience', 'suggested_by')]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.experience.title} suggested to {self.team.name}'


class SuggestionUpvote(models.Model):
    suggestion = models.ForeignKey(
        ExperienceSuggestion, on_delete=models.CASCADE, related_name='upvotes'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='suggestion_upvotes'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'suggestion_upvotes'
        unique_together = [('suggestion', 'user')]

    def __str__(self):
        return f'{self.user.email} upvoted {self.suggestion}'


class OrganisationInvite(models.Model):
    """Pending email invitations for team members not yet registered."""
    org = models.ForeignKey(
        Organisation, on_delete=models.CASCADE, related_name='invites'
    )
    email = models.EmailField()
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='org_invites_sent'
    )
    token = models.CharField(max_length=64, unique=True)
    short_code = models.CharField(
        max_length=9, unique=True, blank=True,
        help_text='Human-readable invite code, e.g. VIVI-A3K9'
    )
    target_role = models.CharField(
        max_length=20, choices=OrganisationMember.ROLE_CHOICES, default='member'
    )
    target_department = models.ForeignKey(
        Department, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='invites'
    )
    target_team = models.ForeignKey(
        Team, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='invites'
    )
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'organisation_invites'

    def __str__(self):
        return f'Invite: {self.email} → {self.org.name}'

    def save(self, *args, **kwargs):
        if not self.short_code:
            # Generate unique short code
            for _ in range(20):
                code = _generate_short_code()
                if not OrganisationInvite.objects.filter(short_code=code).exists():
                    self.short_code = code
                    break
        super().save(*args, **kwargs)
