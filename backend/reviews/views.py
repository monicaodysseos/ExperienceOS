from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer, ReviewResponseSerializer


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response(
            ReviewSerializer(review).data,
            status=status.HTTP_201_CREATED,
        )


class ExperienceReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        slug = self.kwargs['slug']
        return Review.objects.filter(
            experience__slug=slug, is_visible=True,
        ).select_related('author')


class ReviewResponseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            review = Review.objects.get(
                pk=pk, experience__provider__user=request.user,
            )
        except Review.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = ReviewResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review.provider_response = serializer.validated_data['response']
        review.provider_responded_at = timezone.now()
        review.save(update_fields=['provider_response', 'provider_responded_at'])
        return Response(ReviewSerializer(review).data)
