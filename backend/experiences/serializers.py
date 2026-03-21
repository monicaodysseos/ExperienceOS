from rest_framework import serializers

from accounts.models import ProviderProfile
from accounts.serializers import ProviderProfileSerializer
from .models import Category, Experience, ExperienceImage


class ExperienceProviderSerializer(serializers.ModelSerializer):
    """Slim provider serializer used in experience detail — includes user_id for messaging."""
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = ProviderProfile
        fields = ['id', 'user_id', 'display_name', 'bio', 'tagline', 'is_verified']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon']


class ExperienceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperienceImage
        fields = ['id', 'image_url', 'is_cover', 'display_order']


class ExperienceListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    cover_image = serializers.SerializerMethodField()
    provider_name = serializers.CharField(source='provider.display_name', read_only=True)

    class Meta:
        model = Experience
        fields = [
            'id', 'title', 'slug', 'category', 'city',
            'duration_minutes', 'price_per_person', 'currency',
            'min_participants', 'max_participants',
            'average_rating', 'review_count', 'booking_count',
            'cover_image', 'provider_name',
        ]

    def get_cover_image(self, obj):
        cover = obj.images.filter(is_cover=True).first()
        if not cover:
            cover = obj.images.first()
        return cover.image_url if cover else None


class ExperienceDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ExperienceImageSerializer(many=True, read_only=True)
    provider = ExperienceProviderSerializer(read_only=True)

    class Meta:
        model = Experience
        fields = [
            'id', 'title', 'slug', 'description', 'what_included',
            'what_to_bring', 'meeting_point', 'city',
            'latitude', 'longitude', 'duration_minutes',
            'price_per_person', 'currency',
            'min_participants', 'max_participants', 'languages',
            'status', 'average_rating', 'review_count', 'booking_count',
            'category', 'images', 'provider',
            'created_at', 'updated_at',
        ]


class ExperienceCreateSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_active=True),
        source='category',
    )

    class Meta:
        model = Experience
        fields = [
            'title', 'description', 'what_included', 'what_to_bring',
            'meeting_point', 'city', 'latitude', 'longitude',
            'duration_minutes', 'price_per_person',
            'min_participants', 'max_participants', 'languages',
            'category_id',
        ]

    def create(self, validated_data):
        provider = self.context['request'].user.provider_profile
        # Auto-publish: set status to active on creation
        validated_data['status'] = 'active'
        return Experience.objects.create(provider=provider, **validated_data)


class ExperienceImageUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperienceImage
        fields = ['image_url', 'cloudinary_public_id', 'is_cover', 'display_order']
