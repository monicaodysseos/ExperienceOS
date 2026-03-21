import os
import uuid

import cloudinary
import cloudinary.uploader
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.db.models import F, Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Experience, ExperienceImage
from .serializers import (
    CategorySerializer,
    ExperienceListSerializer,
    ExperienceDetailSerializer,
    ExperienceCreateSerializer,
    ExperienceImageUploadSerializer,
)


class IsProviderOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.provider.user == request.user


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class ExperienceListView(generics.ListAPIView):
    serializer_class = ExperienceListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Experience.objects.filter(status='active').select_related(
            'category', 'provider'
        ).prefetch_related('images')

        params = self.request.query_params

        # City filter
        city = params.get('city')
        if city:
            qs = qs.filter(city__iexact=city)

        # Category filter
        category = params.get('category')
        if category:
            qs = qs.filter(category__slug=category)

        # Full-text search via tsvector; fall back to icontains if no vector yet
        q = params.get('q') or params.get('search')
        if q:
            try:
                query = SearchQuery(q, search_type='plain')
                qs = qs.annotate(rank=SearchRank(F('search_vector'), query)).filter(
                    search_vector=query
                ).order_by('-rank')
            except Exception:
                qs = qs.filter(
                    Q(title__icontains=q) | Q(description__icontains=q)
                )

        # Price range
        min_price = params.get('min_price')
        if min_price:
            qs = qs.filter(price_per_person__gte=min_price)

        max_price = params.get('max_price')
        if max_price:
            qs = qs.filter(price_per_person__lte=max_price)

        # Group size — filter to experiences that can accommodate N people
        group_size = params.get('group_size')
        if group_size:
            try:
                size = int(group_size)
                qs = qs.filter(min_participants__lte=size, max_participants__gte=size)
            except ValueError:
                pass

        # Date — filter to experiences that have an available slot on a given date
        date = params.get('date')
        if date:
            from bookings.models import TimeSlot
            from django.utils.dateparse import parse_date
            parsed = parse_date(date)
            if parsed:
                slot_exp_ids = TimeSlot.objects.filter(
                    start_datetime__date=parsed,
                    is_available=True,
                    spots_remaining__gt=0,
                ).values_list('experience_id', flat=True)
                qs = qs.filter(id__in=slot_exp_ids)

        # Provider filter (for public vendor profile page)
        provider_id = params.get('provider')
        if provider_id:
            qs = qs.filter(provider_id=provider_id)

        # Ordering (only applies when not doing FTS rank ordering)
        ordering = params.get('ordering', '-created_at')
        if not q and ordering in ('-created_at', '-average_rating', '-booking_count',
                                   'price_per_person', '-price_per_person'):
            qs = qs.order_by(ordering)

        return qs


class ExperienceDetailView(generics.RetrieveAPIView):
    queryset = Experience.objects.filter(status='active').select_related(
        'category', 'provider', 'provider__user'
    ).prefetch_related('images')
    serializer_class = ExperienceDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class ExperienceCreateView(generics.CreateAPIView):
    serializer_class = ExperienceCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()


class ExperienceUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ExperienceDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsProviderOwner]
    lookup_field = 'slug'

    def get_queryset(self):
        return Experience.objects.filter(provider__user=self.request.user).select_related(
            'category', 'provider', 'provider__user'
        ).prefetch_related('images')

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ExperienceDetailSerializer
        return ExperienceCreateSerializer


class MyExperiencesView(generics.ListAPIView):
    serializer_class = ExperienceListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Experience.objects.filter(
            provider__user=self.request.user
        ).exclude(status='archived').select_related(
            'category', 'provider'
        ).prefetch_related('images')


class ExperienceImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        try:
            experience = Experience.objects.get(
                slug=slug, provider__user=request.user
            )
        except Experience.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = ExperienceImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(experience=experience)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, slug):
        image_id = request.query_params.get('image_id')
        if not image_id:
            return Response(
                {'detail': 'image_id query parameter required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted, _ = ExperienceImage.objects.filter(
            id=image_id, experience__slug=slug,
            experience__provider__user=request.user,
        ).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ImageFileUploadView(APIView):
    """Accept a multipart image file, upload it to Cloudinary (or local storage as fallback)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response(
                {'detail': 'No file provided. Send the image under the "file" field.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Use local storage fallback when Cloudinary is not configured
        if not settings.CLOUDINARY_CLOUD_NAME:
            ext = os.path.splitext(file_obj.name)[1].lower() or '.jpg'
            unique_name = f'experiences/{uuid.uuid4().hex}{ext}'
            fs = FileSystemStorage(
                location=str(settings.MEDIA_ROOT),
                base_url=settings.MEDIA_URL,
            )
            saved_name = fs.save(unique_name, file_obj)
            url = request.build_absolute_uri(fs.url(saved_name))
            return Response(
                {'url': url, 'public_id': saved_name},
                status=status.HTTP_201_CREATED,
            )

        # Cloudinary upload
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
        )

        try:
            result = cloudinary.uploader.upload(
                file_obj,
                folder='experienceos/experiences',
                resource_type='image',
            )
        except Exception as exc:
            return Response(
                {'detail': f'Cloudinary upload failed: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {'url': result['secure_url'], 'public_id': result['public_id']},
            status=status.HTTP_201_CREATED,
        )
