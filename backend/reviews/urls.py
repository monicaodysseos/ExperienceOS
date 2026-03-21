from django.urls import path

from . import views

urlpatterns = [
    path('', views.ReviewCreateView.as_view(), name='review-create'),
    path('experience/<slug:slug>/', views.ExperienceReviewsView.as_view(), name='experience-reviews'),
    path('<int:pk>/respond/', views.ReviewResponseView.as_view(), name='review-respond'),
]
