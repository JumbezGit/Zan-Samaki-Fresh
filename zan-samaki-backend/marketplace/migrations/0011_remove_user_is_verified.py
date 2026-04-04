from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0010_reactivate_users_created_inactive'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='is_verified',
        ),
    ]
