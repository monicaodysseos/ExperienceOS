from django.contrib import admin
from .models import (
    Organisation, OrganisationMember, OrganisationInvite,
    Department, Team, TeamMember, BudgetTransaction,
    Poll, PollOption,
    ExperienceSuggestion,
)


class OrganisationMemberInline(admin.TabularInline):
    model = OrganisationMember
    extra = 0
    raw_id_fields = ['user', 'invited_by']
    readonly_fields = ['joined_at', 'created_at']


class DepartmentInline(admin.TabularInline):
    model = Department
    extra = 0
    raw_id_fields = ['head']
    readonly_fields = ['budget_spent', 'created_at']


@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    list_display = ['name', 'billing_email', 'domain', 'subscription_tier', 'member_count', 'created_at']
    list_filter = ['subscription_tier', 'deleted_at']
    search_fields = ['name', 'billing_email', 'domain']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [OrganisationMemberInline, DepartmentInline]

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
    list_display = ['email', 'org', 'target_role', 'invited_by', 'expires_at', 'accepted_at', 'created_at']
    list_filter = ['accepted_at', 'target_role']
    search_fields = ['email', 'org__name']
    raw_id_fields = ['org', 'invited_by', 'target_department', 'target_team']


class TeamInline(admin.TabularInline):
    model = Team
    extra = 0
    raw_id_fields = ['created_by']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'org', 'head', 'budget_total', 'budget_spent', 'budget_remaining', 'created_at']
    list_filter = ['org']
    search_fields = ['name', 'org__name']
    raw_id_fields = ['org', 'head']
    readonly_fields = ['budget_spent', 'created_at', 'updated_at']
    inlines = [TeamInline]

    def budget_remaining(self, obj):
        return obj.budget_remaining
    budget_remaining.short_description = 'Remaining'


class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 0
    raw_id_fields = ['user']
    readonly_fields = ['joined_at']


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'member_count', 'created_at']
    list_filter = ['department__org']
    search_fields = ['name', 'department__name']
    raw_id_fields = ['department', 'created_by']
    inlines = [TeamMemberInline]

    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Members'


@admin.register(BudgetTransaction)
class BudgetTransactionAdmin(admin.ModelAdmin):
    list_display = ['department', 'type', 'amount', 'created_by', 'created_at']
    list_filter = ['type', 'department__org']
    search_fields = ['department__name', 'note']
    raw_id_fields = ['department', 'booking', 'created_by']
    readonly_fields = ['created_at']


class PollOptionInline(admin.TabularInline):
    model = PollOption
    extra = 0
    raw_id_fields = ['experience']


@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    list_display = ['title', 'team', 'type', 'status', 'created_by', 'created_at']
    list_filter = ['type', 'status']
    search_fields = ['title', 'team__name']
    raw_id_fields = ['team', 'created_by']
    inlines = [PollOptionInline]


@admin.register(ExperienceSuggestion)
class ExperienceSuggestionAdmin(admin.ModelAdmin):
    list_display = ['experience', 'team', 'suggested_by', 'upvote_count', 'created_at']
    search_fields = ['experience__title', 'team__name']
    raw_id_fields = ['team', 'experience', 'suggested_by']

    def upvote_count(self, obj):
        return obj.upvotes.count()
    upvote_count.short_description = 'Upvotes'
