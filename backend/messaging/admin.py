from django.contrib import admin

from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['sender', 'content', 'is_read', 'created_at']


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['participant1', 'participant2', 'experience', 'last_message_at']
    raw_id_fields = ['participant1', 'participant2', 'experience']
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'sender', 'content_preview', 'is_read', 'created_at']
    list_filter = ['is_read']
    raw_id_fields = ['conversation', 'sender']

    def content_preview(self, obj):
        return obj.content[:50]
