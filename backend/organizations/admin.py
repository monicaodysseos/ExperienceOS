from django.contrib import admin
from .models import Organisation, OrganisationMember, OrganisationInvite


class OrganisationMemberInline(admin.TabularInline):
    model = OrganisationMember
    extra = 0
    raw_id_fields = ['user', 'invited_by']
    readonly_fields = ['joined_at', 'created_at']


@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    list_display = ['name', 'billing_email', 'domain', 'subscription_tier', 'member_count', 'created_at']
    list_filter = ['subscription_tier', 'deleted_at']
    search_fields = ['name', 'billing_email', 'domain']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [OrganisationMemberInline]

    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Members'


@admin.register(OrganisationMember)
class OrganisationMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'org', 'role', 'joined_at', 'created_at']
    list_filter = ['role']
    raw_id_fields = ['user', 'org', 'invited_by']
    search_fields = ['user__email', 'org__name']


@admin.register(OrganisationInvite)
class OrganisationInviteAdmin(admin.ModelAdmin):
    list_display = ['email', 'org', 'invited_by', 'expires_at', 'accepted_at', 'created_at']
    list_filter = ['accepted_at']
    search_fields = ['email', 'org__name']
    raw_id_fields = ['org', 'invited_by']
