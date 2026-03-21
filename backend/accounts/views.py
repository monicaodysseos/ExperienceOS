from django.contrib.auth import get_user_model
from django.core import signing
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken


class AuthAnonThrottle(AnonRateThrottle):
    rate = '5/minute'
    scope = 'auth_anon'


class AuthUserThrottle(UserRateThrottle):
    rate = '10/minute'
    scope = 'auth'

from .models import ProviderProfile
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    UserUpdateSerializer,
    ProviderProfileSerializer,
    ProviderProfileCreateSerializer,
)
from .tasks import send_verification_email, send_password_reset_email

User = get_user_model()

VERIFICATION_TOKEN_MAX_AGE = 86400   # 24 hours
RESET_TOKEN_MAX_AGE = 3600           # 1 hour


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthAnonThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Queue verification email (non-blocking, best-effort)
        try:
            send_verification_email.delay(user.id)
        except Exception:
            pass  # Don't block registration if email queuing fails
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    def delete(self, request):
        from django.utils import timezone
        user = request.user
        user.is_active = False
        user.deleted_at = timezone.now()
        user.email = f'deleted_{user.id}@deleted.com'
        user.first_name = ''
        user.last_name = ''
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    """Verify email using a signed token sent to the user's inbox."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'detail': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data = signing.loads(token, salt='email-verification', max_age=VERIFICATION_TOKEN_MAX_AGE)
        except signing.SignatureExpired:
            return Response({'detail': 'This verification link has expired. Please request a new one.'}, status=400)
        except signing.BadSignature:
            return Response({'detail': 'Invalid verification token.'}, status=400)

        try:
            user = User.objects.get(id=data['user_id'])
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])
        return Response({'detail': 'Email verified successfully.'})


class ResendVerificationView(APIView):
    """Re-send the verification email to the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.is_email_verified:
            return Response({'detail': 'Email is already verified.'})
        send_verification_email.delay(request.user.id)
        return Response({'detail': 'Verification email sent.'})


class ForgotPasswordView(APIView):
    """Request a password reset email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=400)

        # Always return 200 to avoid user enumeration
        try:
            user = User.objects.get(email__iexact=email, is_active=True)
            send_password_reset_email.delay(user.id)
        except User.DoesNotExist:
            pass

        return Response({'detail': 'If an account exists with that email, a reset link has been sent.'})


class ResetPasswordView(APIView):
    """Reset password using the signed token from the reset email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('password')

        if not token or not new_password:
            return Response({'detail': 'Token and password are required.'}, status=400)

        if len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=400)

        try:
            data = signing.loads(token, salt='password-reset', max_age=RESET_TOKEN_MAX_AGE)
        except signing.SignatureExpired:
            return Response({'detail': 'This reset link has expired. Please request a new one.'}, status=400)
        except signing.BadSignature:
            return Response({'detail': 'Invalid reset token.'}, status=400)

        try:
            user = User.objects.get(id=data['user_id'])
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

        user.set_password(new_password)
        user.save(update_fields=['password'])
        return Response({'detail': 'Password reset successfully. You can now log in.'})


class ProviderProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.provider_profile
            return Response(ProviderProfileSerializer(profile).data)
        except ProviderProfile.DoesNotExist:
            return Response(
                {'detail': 'No provider profile found.'},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        if hasattr(request.user, 'provider_profile'):
            return Response(
                {'detail': 'Provider profile already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = ProviderProfileCreateSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(
            ProviderProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED
        )

    def patch(self, request):
        try:
            profile = request.user.provider_profile
        except ProviderProfile.DoesNotExist:
            return Response(
                {'detail': 'No provider profile found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ProviderProfileCreateSerializer(
            profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProviderProfileSerializer(profile).data)


class ProviderPublicView(generics.RetrieveAPIView):
    queryset = ProviderProfile.objects.filter(user__is_active=True)
    serializer_class = ProviderProfileSerializer
    permission_classes = [permissions.AllowAny]
