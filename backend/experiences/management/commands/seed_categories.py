from django.core.management.base import BaseCommand

from experiences.models import Category

CATEGORIES = [
    {'name': 'Workshops', 'slug': 'workshops', 'icon': 'hammer', 'display_order': 1},
    {'name': 'Tours', 'slug': 'tours', 'icon': 'figure.walk', 'display_order': 2},
    {'name': 'Wellness', 'slug': 'wellness', 'icon': 'figure.yoga', 'display_order': 3},
    {'name': 'Food & Drink', 'slug': 'food-drink', 'icon': 'fork.knife', 'display_order': 4},
    {'name': 'Arts', 'slug': 'arts', 'icon': 'paintpalette', 'display_order': 5},
    {'name': 'Outdoor', 'slug': 'outdoor', 'icon': 'leaf', 'display_order': 6},
    {'name': 'Nightlife', 'slug': 'nightlife', 'icon': 'moon.stars', 'display_order': 7},
    {'name': 'Games', 'slug': 'games', 'icon': 'gamecontroller', 'display_order': 8},
    {'name': 'Music', 'slug': 'music', 'icon': 'music.note', 'display_order': 9},
    {'name': 'Learning', 'slug': 'learning', 'icon': 'book', 'display_order': 10},
]


class Command(BaseCommand):
    help = 'Seed default experience categories'

    def handle(self, *args, **options):
        created_count = 0
        for cat_data in CATEGORIES:
            _, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data,
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f'Seeded {created_count} new categories ({len(CATEGORIES)} total)')
        )
