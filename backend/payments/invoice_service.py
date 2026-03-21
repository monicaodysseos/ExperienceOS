from decimal import Decimal
from io import BytesIO

from django.conf import settings


VAT_RATE = Decimal('0.19')  # 19% Cyprus standard VAT


def create_invoice_for_booking(booking):
    """Create an Invoice record for a confirmed+paid booking. Idempotent."""
    from .models import Invoice

    if hasattr(booking, 'invoice'):
        return booking.invoice

    subtotal = booking.total_price
    vat_amount = (subtotal * VAT_RATE).quantize(Decimal('0.01'))
    total_with_vat = subtotal + vat_amount

    org = booking.org
    billing_name = org.name if org else booking.participant.get_full_name()
    billing_email = org.billing_email if org else booking.participant.email
    billing_address = org.billing_address if org else None

    invoice = Invoice.objects.create(
        booking=booking,
        org=org,
        subtotal=subtotal,
        vat_rate=VAT_RATE,
        vat_amount=vat_amount,
        total_with_vat=total_with_vat,
        billing_name=billing_name,
        billing_email=billing_email,
        billing_address=billing_address,
    )
    return invoice


def generate_invoice_pdf(invoice) -> bytes:
    """Generate a PDF for the invoice using ReportLab. Returns bytes."""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
        )
        from reportlab.lib.enums import TA_RIGHT, TA_LEFT
    except ImportError:
        # ReportLab not installed — return a minimal PDF placeholder
        return _minimal_pdf(invoice)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    bold = ParagraphStyle('bold', parent=styles['Normal'], fontName='Helvetica-Bold')
    right = ParagraphStyle('right', parent=styles['Normal'], alignment=TA_RIGHT)
    right_bold = ParagraphStyle('right_bold', parent=bold, alignment=TA_RIGHT)
    small = ParagraphStyle('small', parent=styles['Normal'], fontSize=9, textColor=colors.grey)

    story = []
    W = A4[0] - 4 * cm  # usable width

    # Header: company name + invoice label
    header_data = [
        [Paragraph('<b>ExperienceOS</b>', styles['Heading2']),
         Paragraph(f'<b>INVOICE</b><br/><font size="9" color="grey">{invoice.invoice_number}</font>', right_bold)],
    ]
    header_table = Table(header_data, colWidths=[W * 0.55, W * 0.45])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width='100%', thickness=0.5, color=colors.lightgrey, spaceAfter=12))

    # Dates
    issued = invoice.issued_at.strftime('%d %B %Y')
    story.append(Paragraph(f'<b>Issue Date:</b> {issued}', styles['Normal']))
    story.append(Paragraph(f'<b>Due:</b> {issued} (pre-paid)', styles['Normal']))
    story.append(Spacer(1, 0.5 * cm))

    # Billed to / from
    billing = []
    if invoice.billing_address:
        addr = invoice.billing_address
        billing = [
            addr.get('street', ''),
            addr.get('city', ''),
            addr.get('postcode', ''),
            addr.get('country', ''),
        ]
        billing = [l for l in billing if l]
        if addr.get('vat_number'):
            billing.append(f'VAT: {addr["vat_number"]}')

    billed_to_lines = [f'<b>Billed To</b>', invoice.billing_name, invoice.billing_email] + billing
    billed_from_lines = [
        '<b>From</b>',
        'ExperienceOS Ltd',
        'Nicosia, Cyprus',
        'info@experienceos.com',
    ]

    billing_data = [
        ['\n'.join(billed_to_lines), '\n'.join(billed_from_lines)],
    ]
    billing_table = Table(billing_data, colWidths=[W * 0.55, W * 0.45])
    billing_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(billing_table)
    story.append(Spacer(1, 0.5 * cm))
    story.append(HRFlowable(width='100%', thickness=0.5, color=colors.lightgrey, spaceAfter=12))

    # Line items
    booking = invoice.booking
    slot_dt = booking.time_slot.start_datetime.strftime('%d %b %Y, %H:%M')
    description = f'{booking.experience.title}\n{slot_dt} · {booking.num_participants} person(s)'

    items_data = [
        ['Description', 'Qty', 'Unit Price', 'Amount'],
        [description, str(booking.num_participants),
         f'€{booking.unit_price}', f'€{invoice.subtotal}'],
    ]
    col_widths = [W * 0.50, W * 0.10, W * 0.20, W * 0.20]
    items_table = Table(items_data, colWidths=col_widths)
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f7f4')]),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#e5e2d8')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 0.3 * cm))

    # Totals
    totals_data = [
        ['', '', 'Subtotal', f'€{invoice.subtotal}'],
        ['', '', f'VAT ({int(invoice.vat_rate * 100)}%)', f'€{invoice.vat_amount}'],
        ['', '', 'Total', f'€{invoice.total_with_vat}'],
    ]
    totals_table = Table(totals_data, colWidths=col_widths)
    totals_table.setStyle(TableStyle([
        ('FONTNAME', (2, 2), (3, 2), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (2, 0), (3, -1), 'RIGHT'),
        ('LINEABOVE', (2, 2), (3, 2), 0.5, colors.HexColor('#1a1a2e')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(totals_table)

    # Payment reference
    story.append(Spacer(1, 0.5 * cm))
    story.append(HRFlowable(width='100%', thickness=0.5, color=colors.lightgrey, spaceAfter=8))
    try:
        payment = booking.payment
        story.append(Paragraph(
            f'Payment Reference: {payment.stripe_payment_intent_id or "—"}',
            small
        ))
    except Exception:
        pass
    story.append(Paragraph('Thank you for booking with ExperienceOS.', small))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def _minimal_pdf(invoice) -> bytes:
    """Fallback: a very simple PDF using only stdlib if ReportLab unavailable."""
    content = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 200 >>
stream
BT /F1 14 Tf 50 800 Td (Invoice {invoice.invoice_number}) Tj
0 -30 Td /F1 10 Tf ({invoice.billing_name}) Tj
0 -20 Td (Subtotal: EUR {invoice.subtotal}) Tj
0 -20 Td (VAT: EUR {invoice.vat_amount}) Tj
0 -20 Td (Total: EUR {invoice.total_with_vat}) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref 0 6
trailer << /Size 6 /Root 1 0 R >>
startxref 0
%%EOF"""
    return content.encode()
