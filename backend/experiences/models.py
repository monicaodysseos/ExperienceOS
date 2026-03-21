from autoslug import AutoSlugField
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'categories'
        ordering = ['display_order']
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Experience(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_review', 'Pending Review'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('archived', 'Archived'),
    ]

    provider = models.ForeignKey(
        'accounts.ProviderProfile',
        on_delete=models.CASCADE,
        related_name='experiences',
    )
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name='experiences',
    )
    title = models.CharField(max_length=200)
    slug = AutoSlugField(populate_from='title', unique=True)
    description = models.TextField()
    what_included = models.TextField(blank=True)
    what_to_bring = models.TextField(blank=True)
    meeting_point = models.CharField(max_length=300, blank=True)
    city = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    duration_minutes = models.PositiveIntegerField()
    price_per_person = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=3, default='EUR')
    min_participants = models.PositiveIntegerField(default=1)
    max_participants = models.PositiveIntegerField(default=10)
    languages = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)
    booking_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'experiences'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'city']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.title


class ExperienceImage(models.Model):
    experience = models.ForeignKey(
        Experience, on_delete=models.CASCADE, related_name='images',
    )
    image_url = models.URLField()
    cloudinary_public_id = models.CharField(max_length=200, blank=True)
    is_cover = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'experience_images'
        ordering = ['display_order']

    def __str__(self):
        return f'{self.experience.title} - Image {self.display_order}'
