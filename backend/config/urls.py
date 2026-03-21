"""URL configuration for ExperienceOS."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from django.utils import timezone


def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0',
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', health_check, name='health-check'),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/org/', include('organizations.urls')),
    path('api/v1/experiences/', include('experiences.urls')),
    path('api/v1/categories/', include('experiences.category_urls')),
    path('api/v1/bookings/', include('bookings.urls')),
    path('api/v1/payments/', include('payments.urls')),
    path('api/v1/reviews/', include('reviews.urls')),
    path('api/v1/messages/', include('messaging.urls')),
    path('api/v1/platform-admin/', include('accounts.admin_urls')),
    path('api/v1/notifications/', include('notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
