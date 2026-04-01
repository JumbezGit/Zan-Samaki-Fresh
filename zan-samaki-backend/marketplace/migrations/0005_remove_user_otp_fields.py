from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0004_merge_20260330_1655'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='otp_code',
        ),
        migrations.RemoveField(
            model_name='user',
            name='otp_expires_at',
        ),
    ]
