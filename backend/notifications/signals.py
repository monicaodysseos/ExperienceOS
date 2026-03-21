from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='messaging.Message')
def on_new_message(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        from .models import Notification
        conversation = instance.conversation
        recipient = (
            conversation.participant2
            if instance.sender_id == conversation.participant1_id
            else conversation.participant1
        )
        if recipient == instance.sender:
            return
        exp_title = conversation.experience.title if conversation.experience_id else ''
        body = instance.content[:120] if instance.content else ''
        Notification.objects.create(
            user=recipient,
            type=Notification.TYPE_NEW_MESSAGE,
            title=f'New message from {instance.sender.first_name or instance.sender.email}',
            body=f'{exp_title}: {body}' if exp_title else body,
            link='/dashboard/messages',
        )
    except Exception:
        pass


@receiver(post_save, sender='bookings.Booking')
def on_new_booking(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        from .models import Notification
        provider_user = instance.experience.provider.user
        Notification.objects.create(
            user=provider_user,
            type=Notification.TYPE_NEW_BOOKING,
            title=f'New booking: {instance.experience.title}',
            body=(
                f'{instance.num_participants} guest{"s" if instance.num_participants > 1 else ""} '
                f'· {instance.booking_reference}'
            ),
            link='/dashboard/provider/bookings',
        )
    except Exception:
        pass
