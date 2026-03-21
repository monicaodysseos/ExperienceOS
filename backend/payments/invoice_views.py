from django.http import HttpResponse
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers as drf_serializers

from .models import Invoice, Payout
from .invoice_service import generate_invoice_pdf


class InvoiceSerializer(drf_serializers.ModelSerializer):
    booking_reference = drf_serializers.CharField(source='booking.booking_reference', read_only=True)
    experience_title = drf_serializers.CharField(source='booking.experience.title', read_only=True)
    booking_date = drf_serializers.DateTimeField(source='booking.time_slot.start_datetime', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'booking_reference', 'experience_title',
            'booking_date', 'subtotal', 'vat_rate', 'vat_amount', 'total_with_vat',
            'currency', 'billing_name', 'billing_email', 'billing_address',
            'pdf_generated', 'issued_at',
        ]


class PayoutSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = [
            'id', 'stripe_payout_id', 'amount', 'currency',
            'status', 'period_start', 'period_end', 'created_at',
        ]


class OrgInvoicesView(APIView):
    """List all invoices for the HR manager's organisation."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.org_id:
            return Response({'detail': 'Not part of an organisation.'}, status=404)
        invoices = Invoice.objects.filter(
            org=request.user.org
        ).select_related('booking__experience', 'booking__time_slot').order_by('-issued_at')
        serializer = InvoiceSerializer(invoices, many=True)
        return Response({'results': serializer.data, 'count': invoices.count()})


class InvoiceDownloadView(APIView):
    """Download a specific invoice as PDF."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, invoice_number):
        try:
            invoice = Invoice.objects.select_related(
                'booking__experience', 'booking__time_slot',
                'booking__participant', 'org',
            ).get(invoice_number=invoice_number)
        except Invoice.DoesNotExist:
            from rest_framework.response import Response
            from rest_framework import status
            return Response({'detail': 'Invoice not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Permission check: org member or admin
        if invoice.org and request.user.org != invoice.org:
            if not request.user.is_staff:
                return Response({'detail': 'Forbidden.'}, status=403)

        pdf_bytes = generate_invoice_pdf(invoice)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename="{invoice.invoice_number}.pdf"'
        )
        return response


class VendorPayoutsView(APIView):
    """List payouts for the authenticated vendor."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            provider = request.user.provider_profile
        except Exception:
            return Response({'detail': 'No provider profile found.'}, status=404)
        payouts = Payout.objects.filter(provider=provider).order_by('-created_at')
        serializer = PayoutSerializer(payouts, many=True)

        total_paid = sum(p.amount for p in payouts if p.status == 'paid')
        return Response({
            'results': serializer.data,
            'count': payouts.count(),
            'total_paid': str(total_paid),
        })
