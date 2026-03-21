from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, ProviderProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'city', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'city']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('ExperienceOS', {
            'fields': ('role', 'phone', 'avatar_url', 'city', 'preferred_language',
                       'stripe_customer_id', 'gdpr_accepted', 'gdpr_accepted_at'),
        }),
    )


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'user', 'is_verified', 'stripe_charges_enabled', 'created_at']
    list_filter = ['is_verified', 'stripe_charges_enabled']
    search_fields = ['display_name', 'user__email']
    raw_id_fields = ['user']
