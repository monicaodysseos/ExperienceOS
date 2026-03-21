from django.db.models import Avg, Count
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import Review


@receiver([post_save, post_delete], sender=Review)
def update_experience_rating(sender, instance, **kwargs):
    experience = instance.experience
    stats = experience.reviews.filter(is_visible=True).aggregate(
        avg_rating=Avg('rating'),
        count=Count('id'),
    )
    experience.average_rating = stats['avg_rating'] or 0
    experience.review_count = stats['count']
    experience.save(update_fields=['average_rating', 'review_count'])
