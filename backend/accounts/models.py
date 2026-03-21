from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # Legacy B2C roles (kept for backward compatibility)
    # B2B roles added for HR marketplace
    ROLE_CHOICES = [
        ('participant', 'Participant'),
        ('provider', 'Provider'),
        ('both', 'Both'),
        ('admin', 'Admin'),
        # B2B roles
        ('hr_manager', 'HR Manager'),
        ('employee', 'Employee'),
        ('vendor_admin', 'Vendor Admin'),
        ('vendor_staff', 'Vendor Staff'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='participant')
    phone = models.CharField(max_length=20, blank=True)
    avatar_url = models.URLField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    preferred_language = models.CharField(max_length=5, default='en')
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    gdpr_accepted = models.BooleanField(default=False)
    gdpr_accepted_at = models.DateTimeField(null=True, blank=True)
    is_email_verified = models.BooleanField(default=False)
    org = models.ForeignKey(
        'organizations.Organisation',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='users',
    )
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    def is_provider(self):
        return self.role in ('provider', 'both', 'admin', 'vendor_admin', 'vendor_staff')

    def is_participant(self):
        return self.role in ('participant', 'both', 'admin')

    def is_hr_manager(self):
        return self.role == 'hr_manager'

    def is_vendor_admin(self):
        return self.role in ('vendor_admin', 'admin')


class ProviderProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile')
    display_name = models.CharField(max_length=100)
    bio = models.TextField(blank=True)
    tagline = models.CharField(max_length=200, blank=True)
    website = models.URLField(blank=True)
    instagram = models.CharField(max_length=100, blank=True)
    stripe_account_id = models.CharField(max_length=100, blank=True)
    stripe_onboarding_complete = models.BooleanField(default=False)
    stripe_charges_enabled = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'provider_profiles'

    def __str__(self):
        return self.display_name
