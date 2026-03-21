from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['experience', 'author', 'rating', 'is_visible', 'created_at']
    list_filter = ['rating', 'is_visible']
    search_fields = ['experience__title', 'author__email', 'comment']
    raw_id_fields = ['booking', 'author', 'experience']
