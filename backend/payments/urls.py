from django.urls import path

from . import views
from .invoice_views import VendorPayoutsView

urlpatterns = [
    path('create-checkout-session/', views.CreateCheckoutSessionView.as_view(), name='create-checkout'),
    path('direct-confirm/', views.DirectConfirmView.as_view(), name='direct-confirm'),
    path('stripe/mock-connect/', views.MockStripeConnectView.as_view(), name='stripe-mock-connect'),
    path('<str:booking_reference>/status/', views.PaymentStatusView.as_view(), name='payment-status'),
    path('webhook/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
    path('stripe/onboarding/', views.StripeConnectOnboardingView.as_view(), name='stripe-onboarding'),
    path('stripe/status/', views.StripeConnectStatusView.as_view(), name='stripe-status'),
    path('payouts/', VendorPayoutsView.as_view(), name='vendor-payouts'),
]
