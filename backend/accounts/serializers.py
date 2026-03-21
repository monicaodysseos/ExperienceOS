from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import ProviderProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    gdpr_accepted = serializers.BooleanField(required=True)
    role = serializers.ChoiceField(
        choices=['participant', 'provider', 'hr_manager'],
        default='participant',
        required=False,
    )

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'role', 'gdpr_accepted']

    def validate_gdpr_accepted(self, value):
        if not value:
            raise serializers.ValidationError('You must accept the privacy policy to register.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email address already exists.')
        return value

    def create(self, validated_data):
        from django.utils import timezone
        role = validated_data.pop('role', 'participant')
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=role,
            gdpr_accepted=True,
            gdpr_accepted_at=timezone.now(),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    has_provider_profile = serializers.SerializerMethodField()
    org_id = serializers.PrimaryKeyRelatedField(source='org', read_only=True)
    org_name = serializers.CharField(source='org.name', read_only=True, default=None)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role',
            'phone', 'avatar_url', 'city', 'preferred_language',
            'has_provider_profile', 'is_email_verified',
            'org_id', 'org_name', 'date_joined',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_email_verified', 'date_joined']

    def get_has_provider_profile(self, obj):
        return hasattr(obj, 'provider_profile')


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'avatar_url', 'city', 'preferred_language']


class ProviderProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ProviderProfile
        fields = [
            'id', 'user_email', 'display_name', 'bio', 'tagline',
            'website', 'instagram', 'stripe_onboarding_complete',
            'stripe_charges_enabled', 'is_verified',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'stripe_onboarding_complete', 'stripe_charges_enabled',
            'is_verified', 'created_at', 'updated_at',
        ]


class ProviderProfileCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderProfile
        fields = ['display_name', 'bio', 'tagline', 'website', 'instagram']

    def create(self, validated_data):
        user = self.context['request'].user
        user.role = 'both' if user.role == 'participant' else user.role
        user.save(update_fields=['role'])
        return ProviderProfile.objects.create(user=user, **validated_data)
