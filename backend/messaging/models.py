from django.db import models


class Conversation(models.Model):
    participant1 = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='conversations_as_p1',
    )
    participant2 = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='conversations_as_p2',
    )
    experience = models.ForeignKey(
        'experiences.Experience', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='conversations',
    )
    last_message_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'conversations'
        ordering = ['-last_message_at']
        constraints = [
            models.UniqueConstraint(
                fields=['participant1', 'participant2', 'experience'],
                name='unique_conversation',
            ),
        ]

    def __str__(self):
        return f'{self.participant1} <-> {self.participant2}'


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages',
    )
    sender = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='messages_sent',
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender} at {self.created_at}'
