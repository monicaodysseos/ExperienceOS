from django.conf import settings
from django.db import models


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
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'organisation_invites'

    def __str__(self):
        return f'Invite: {self.email} → {self.org.name}'
