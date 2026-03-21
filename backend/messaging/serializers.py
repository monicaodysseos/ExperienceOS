from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender_name', 'content', 'is_read', 'is_mine', 'created_at']

    def get_sender_name(self, obj):
        return f'{obj.sender.first_name} {obj.sender.last_name}'.strip() or obj.sender.email

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return request and obj.sender_id == request.user.id


class ConversationSerializer(serializers.ModelSerializer):
    other_user_name = serializers.SerializerMethodField()
    other_user_id = serializers.SerializerMethodField()
    experience_title = serializers.CharField(source='experience.title', default=None)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'other_user_name', 'other_user_id',
            'experience_title', 'last_message', 'unread_count',
            'last_message_at', 'created_at',
        ]

    def _get_other_user(self, obj):
        request = self.context.get('request')
        if request and obj.participant1_id == request.user.id:
            return obj.participant2
        return obj.participant1

    def get_other_user_name(self, obj):
        other = self._get_other_user(obj)
        return f'{other.first_name} {other.last_name}'.strip() or other.email

    def get_other_user_id(self, obj):
        return self._get_other_user(obj).id

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        return msg.content[:100] if msg else None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()


class ConversationCreateSerializer(serializers.Serializer):
    other_user_id = serializers.IntegerField()
    experience_id = serializers.IntegerField(required=False)
    message = serializers.CharField()
