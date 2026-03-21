from django.urls import path

from . import views

urlpatterns = [
    # Participant endpoints
    path('', views.MyBookingsView.as_view(), name='my-bookings'),
    path('create/', views.BookingCreateView.as_view(), name='booking-create'),
    path('<str:booking_reference>/', views.BookingDetailView.as_view(), name='booking-detail'),
    path('<str:booking_reference>/cancel/', views.BookingCancelView.as_view(), name='booking-cancel'),
    # Provider endpoints
    path('provider/list/', views.ProviderBookingsView.as_view(), name='provider-bookings'),
    # Time slots (nested under experiences in config/urls or called directly)
    path('slots/<slug:slug>/', views.TimeSlotListView.as_view(), name='timeslot-list'),
    path('slots/<slug:slug>/create/', views.TimeSlotCreateView.as_view(), name='timeslot-create'),
    path('slots/<slug:slug>/<int:pk>/', views.TimeSlotUpdateView.as_view(), name='timeslot-update'),
    path('slots/<slug:slug>/<int:pk>/delete/', views.TimeSlotDeleteView.as_view(), name='timeslot-delete'),
]
