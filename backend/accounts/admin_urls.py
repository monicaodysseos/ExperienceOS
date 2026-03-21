from django.urls import path
from .admin_views import (
    AdminStatsView,
    AdminVendorListView,
    AdminVendorApproveView,
    AdminVendorRejectView,
    AdminExperienceListView,
    AdminExperienceApproveView,
    AdminExperienceRejectView,
    AdminBookingListView,
    AdminUserListView,
)

urlpatterns = [
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('vendors/', AdminVendorListView.as_view(), name='admin-vendors'),
    path('vendors/<int:pk>/approve/', AdminVendorApproveView.as_view(), name='admin-vendor-approve'),
    path('vendors/<int:pk>/reject/', AdminVendorRejectView.as_view(), name='admin-vendor-reject'),
    path('experiences/', AdminExperienceListView.as_view(), name='admin-experiences'),
    path('experiences/<slug:slug>/approve/', AdminExperienceApproveView.as_view(), name='admin-experience-approve'),
    path('experiences/<slug:slug>/reject/', AdminExperienceRejectView.as_view(), name='admin-experience-reject'),
    path('bookings/', AdminBookingListView.as_view(), name='admin-bookings'),
    path('users/', AdminUserListView.as_view(), name='admin-users'),
]
