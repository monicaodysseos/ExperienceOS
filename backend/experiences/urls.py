from django.urls import path

from . import views

urlpatterns = [
    path('', views.ExperienceListView.as_view(), name='experience-list'),
    path('create/', views.ExperienceCreateView.as_view(), name='experience-create'),
    path('mine/', views.MyExperiencesView.as_view(), name='my-experiences'),
    path('upload-image/', views.ImageFileUploadView.as_view(), name='upload-image'),
    path('<slug:slug>/', views.ExperienceDetailView.as_view(), name='experience-detail'),
    path('<slug:slug>/update/', views.ExperienceUpdateView.as_view(), name='experience-update'),
    path('<slug:slug>/delete/', views.ExperienceDeleteView.as_view(), name='experience-delete'),
    path('<slug:slug>/images/', views.ExperienceImageUploadView.as_view(), name='experience-images'),
]
