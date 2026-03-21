from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from experiences.models import Experience
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    ConversationCreateSerializer,
    MessageSerializer,
)

User = get_user_model()


class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(
            Q(participant1=self.request.user) | Q(participant2=self.request.user)
        ).select_related('participant1', 'participant2', 'experience')


class ConversationCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ConversationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        other_user_id = serializer.validated_data['other_user_id']
        experience_id = serializer.validated_data.get('experience_id')
        message_content = serializer.validated_data['message']

        try:
            other_user = User.objects.get(id=other_user_id, is_active=True)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        experience = None
        if experience_id:
            try:
                experience = Experience.objects.get(id=experience_id)
            except Experience.DoesNotExist:
                pass

        # Check if conversation exists (in either direction)
        conversation = Conversation.objects.filter(
            Q(participant1=request.user, participant2=other_user) |
            Q(participant1=other_user, participant2=request.user),
            experience=experience,
        ).first()

        if not conversation:
            conversation = Conversation.objects.create(
                participant1=request.user,
                participant2=other_user,
                experience=experience,
            )

        Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=message_content,
        )
        conversation.last_message_at = timezone.now()
        conversation.save(update_fields=['last_message_at'])

        return Response(
            ConversationSerializer(conversation, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ConversationMessagesView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs['pk']
        return Message.objects.filter(
            conversation_id=conversation_id,
            conversation__in=Conversation.objects.filter(
                Q(participant1=self.request.user) | Q(participant2=self.request.user)
            ),
        ).select_related('sender')


class SendMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            conversation = Conversation.objects.get(
                Q(participant1=request.user) | Q(participant2=request.user),
                pk=pk,
            )
        except Conversation.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        content = request.data.get('content')
        if not content:
            return Response(
                {'detail': 'Message content is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
        )
        conversation.last_message_at = timezone.now()
        conversation.save(update_fields=['last_message_at'])

        return Response(
            MessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class MarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        Message.objects.filter(
            conversation_id=pk,
            is_read=False,
        ).exclude(sender=request.user).update(is_read=True)
        return Response(status=status.HTTP_200_OK)


class UnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(
            conversation__in=Conversation.objects.filter(
                Q(participant1=request.user) | Q(participant2=request.user)
            ),
            is_read=False,
        ).exclude(sender=request.user).count()
        return Response({'unread_count': count})
