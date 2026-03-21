from django.contrib import admin

from .models import Category, Experience, ExperienceImage


class ExperienceImageInline(admin.TabularInline):
    model = ExperienceImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'display_order', 'is_active']
    list_editable = ['display_order', 'is_active']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'provider', 'category', 'city', 'price_per_person',
        'status', 'average_rating', 'booking_count', 'created_at',
    ]
    list_filter = ['status', 'city', 'category']
    search_fields = ['title', 'description', 'provider__display_name']
    raw_id_fields = ['provider']
    inlines = [ExperienceImageInline]
    actions = ['approve_experiences', 'pause_experiences']

    @admin.action(description='Approve selected experiences')
    def approve_experiences(self, request, queryset):
        queryset.filter(status='pending_review').update(status='active')

    @admin.action(description='Pause selected experiences')
    def pause_experiences(self, request, queryset):
        queryset.filter(status='active').update(status='paused')
