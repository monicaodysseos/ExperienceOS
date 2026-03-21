from django.urls import path
from . import views
from payments.invoice_views import OrgInvoicesView, InvoiceDownloadView

urlpatterns = [
    path('', views.OrgDetailView.as_view(), name='org-detail'),
    path('create/', views.OrgCreateView.as_view(), name='org-create'),
    path('dashboard/', views.OrgDashboardView.as_view(), name='org-dashboard'),
    path('bookings/', views.OrgBookingsView.as_view(), name='org-bookings'),
    path('invoices/', OrgInvoicesView.as_view(), name='org-invoices'),
    path('invoices/<str:invoice_number>/download/', InvoiceDownloadView.as_view(), name='invoice-download'),
    path('analytics/', views.OrgAnalyticsView.as_view(), name='org-analytics'),
    path('team/', views.TeamMembersView.as_view(), name='org-team'),
    path('team/invite/', views.TeamInviteView.as_view(), name='org-invite'),
    path('invite/accept/', views.AcceptInviteView.as_view(), name='org-invite-accept'),
]
