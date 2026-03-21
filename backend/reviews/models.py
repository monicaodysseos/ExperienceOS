from django.db import models


class Review(models.Model):
    booking = models.OneToOneField(
        'bookings.Booking', on_delete=models.CASCADE, related_name='review',
    )
    author = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='reviews_written',
    )
    experience = models.ForeignKey(
        'experiences.Experience', on_delete=models.CASCADE, related_name='reviews',
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    provider_response = models.TextField(blank=True)
    provider_responded_at = models.DateTimeField(null=True, blank=True)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                check=models.Q(rating__gte=1, rating__lte=5),
                name='valid_rating_range',
            ),
        ]

    def __str__(self):
        return f'{self.author} - {self.experience.title} ({self.rating}/5)'
