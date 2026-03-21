from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bookings", "0002_bookingsequence_booking_org"),
    ]

    operations = [
        migrations.AddField(
            model_name="booking",
            name="reminder_sent",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="booking",
            name="review_request_sent",
            field=models.BooleanField(default=False),
        ),
    ]
