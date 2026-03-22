from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0002_organisationinvite_target_role_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='organisationinvite',
            name='short_code',
            field=models.CharField(
                blank=True,
                help_text='Human-readable invite code, e.g. VIVI-A3K9',
                max_length=9,
                unique=True,
                null=True,
            ),
        ),
    ]
