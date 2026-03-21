import stripe
from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking
from .models import Payment

stripe.api_key = settings.STRIPE_SECRET_KEY


class CreateCheckoutSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_reference = request.data.get('booking_reference')
        try:
            booking = Booking.objects.select_related(
                'experience', 'experience__provider',
            ).get(
                booking_reference=booking_reference,
                participant=request.user,
                status='pending',
            )
        except Booking.DoesNotExist:
            return Response(
                {'detail': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        provider_profile = booking.experience.provider
        if not provider_profile.stripe_account_id:
            return Response(
                {'detail': 'Provider has not completed payment setup.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        total_amount = int((booking.total_price + booking.participant_service_fee) * 100)
        platform_fee = int((booking.platform_fee + booking.participant_service_fee) * 100)

        try:
            session = stripe.checkout.Session.create(
                mode='payment',
                line_items=[{
                    'price_data': {
                        'currency': 'eur',
                        'unit_amount': total_amount,
                        'product_data': {
                            'name': booking.experience.title,
                            'description': (
                                f'{booking.num_participants} participant(s) - '
                                f'{booking.time_slot.start_datetime.strftime("%B %d, %Y at %H:%M")}'
                            ),
                        },
                    },
                    'quantity': 1,
                }],
                payment_intent_data={
                    'application_fee_amount': platform_fee,
                    'transfer_data': {
                        'destination': provider_profile.stripe_account_id,
                    },
                    'metadata': {
                        'booking_reference': booking.booking_reference,
                    },
                },
                success_url=f'{settings.FRONTEND_URL}/bookings/{booking.booking_reference}?status=success',
                cancel_url=f'{settings.FRONTEND_URL}/bookings/{booking.booking_reference}?status=cancelled',
                customer_email=request.user.email,
                metadata={
                    'booking_reference': booking.booking_reference,
                },
            )

            Payment.objects.create(
                booking=booking,
                stripe_payment_intent_id=session.payment_intent or '',
                stripe_checkout_session_id=session.id,
                amount=booking.total_price + booking.participant_service_fee,
                currency='EUR',
            )

            return Response({'checkout_url': session.url})

        except stripe.error.StripeError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PaymentStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_reference):
        try:
            payment = Payment.objects.get(
                booking__booking_reference=booking_reference,
                booking__participant=request.user,
            )
            return Response({
                'status': payment.status,
                'amount': str(payment.amount),
                'currency': payment.currency,
            })
        except Payment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET,
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            booking_ref = session.get('metadata', {}).get('booking_reference')
            if booking_ref:
                try:
                    booking = Booking.objects.get(booking_reference=booking_ref)
                    booking.status = 'confirmed'
                    booking.save(update_fields=['status', 'updated_at'])

                    Payment.objects.filter(
                        stripe_checkout_session_id=session['id']
                    ).update(
                        status='succeeded',
                        stripe_payment_intent_id=session.get('payment_intent', ''),
                    )
                except Booking.DoesNotExist:
                    pass

        elif event['type'] == 'charge.refunded':
            charge = event['data']['object']
            payment_intent_id = charge.get('payment_intent')
            if payment_intent_id:
                try:
                    payment = Payment.objects.get(
                        stripe_payment_intent_id=payment_intent_id,
                    )
                    payment.status = 'refunded'
                    payment.save(update_fields=['status', 'updated_at'])

                    payment.booking.status = 'refunded'
                    payment.booking.save(update_fields=['status', 'updated_at'])
                except Payment.DoesNotExist:
                    pass

        return Response(status=status.HTTP_200_OK)


class MockStripeConnectView(APIView):
    """Set a fake Stripe account ID for testing — bypasses real Stripe onboarding."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            provider = request.user.provider_profile
        except Exception:
            return Response(
                {'detail': 'No provider profile found.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        provider.stripe_account_id = 'acct_mock_test_bypass'
        provider.stripe_charges_enabled = True
        provider.stripe_onboarding_complete = True
        provider.save(update_fields=[
            'stripe_account_id', 'stripe_charges_enabled', 'stripe_onboarding_complete',
        ])
        return Response({
            'connected': True,
            'charges_enabled': True,
            'onboarding_complete': True,
        })


class DirectConfirmView(APIView):
    """Confirm a booking directly without payment (dev/testing bypass)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_reference = request.data.get('booking_reference')
        try:
            booking = Booking.objects.get(
                booking_reference=booking_reference,
                participant=request.user,
                status='pending',
            )
        except Booking.DoesNotExist:
            return Response(
                {'detail': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        booking.status = 'confirmed'
        booking.save(update_fields=['status', 'updated_at'])
        return Response(
            {'status': 'confirmed', 'booking_reference': booking.booking_reference},
        )


class StripeConnectOnboardingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        provider = request.user.provider_profile

        if not provider.stripe_account_id:
            account = stripe.Account.create(
                type='express',
                country='CY',
                email=request.user.email,
                capabilities={
                    'card_payments': {'requested': True},
                    'transfers': {'requested': True},
                },
            )
            provider.stripe_account_id = account.id
            provider.save(update_fields=['stripe_account_id'])

        account_link = stripe.AccountLink.create(
            account=provider.stripe_account_id,
            refresh_url=f'{settings.FRONTEND_URL}/dashboard/stripe/refresh',
            return_url=f'{settings.FRONTEND_URL}/dashboard/stripe/complete',
            type='account_onboarding',
        )

        return Response({'onboarding_url': account_link.url})


class StripeConnectStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        provider = request.user.provider_profile

        if not provider.stripe_account_id:
            return Response({
                'connected': False,
                'charges_enabled': False,
                'onboarding_complete': False,
            })

        account = stripe.Account.retrieve(provider.stripe_account_id)
        provider.stripe_charges_enabled = account.charges_enabled
        provider.stripe_onboarding_complete = account.details_submitted
        provider.save(update_fields=[
            'stripe_charges_enabled', 'stripe_onboarding_complete',
        ])

        return Response({
            'connected': True,
            'charges_enabled': account.charges_enabled,
            'onboarding_complete': account.details_submitted,
        })
