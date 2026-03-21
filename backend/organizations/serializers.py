from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Organisation, OrganisationMember, OrganisationInvite

User = get_user_model()


class OrganisationSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organisation
        fields = [
            'id', 'name', 'domain', 'billing_email', 'billing_address',
            'logo_url', 'max_users', 'subscription_tier', 'member_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'member_count', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()


class OrganisationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organisation
        fields = ['name', 'domain', 'billing_email', 'billing_address', 'logo_url']

    def create(self, validated_data):
        org = Organisation.objects.create(**validated_data)
        # Auto-add the creating user as org admin
        user = self.context['request'].user
        OrganisationMember.objects.create(org=org, user=user, role='admin')
        user.org = org
        user.save(update_fields=['org'])
        return org


class OrganisationMemberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    avatar_url = serializers.URLField(source='user.avatar_url', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = OrganisationMember
        fields = [
            'id', 'email', 'first_name', 'last_name', 'avatar_url',
            'user_role', 'role', 'joined_at', 'created_at',
        ]
        read_only_fields = ['id', 'joined_at', 'created_at']


class TeamInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        org = self.context['org']
        if OrganisationMember.objects.filter(org=org, user__email__iexact=value).exists():
            raise serializers.ValidationError('This person is already a member of your organisation.')
        if OrganisationInvite.objects.filter(
            org=org, email__iexact=value, accepted_at__isnull=True
        ).exists():
            raise serializers.ValidationError('An invitation has already been sent to this email.')
        return value
