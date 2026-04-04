from django.db import migrations


def reactivate_users(apps, schema_editor):
    User = apps.get_model('marketplace', 'User')
    User.objects.filter(is_active=False).update(is_active=True, is_verified=True)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0009_merge_20260401_1000'),
    ]

    operations = [
        migrations.RunPython(reactivate_users, noop_reverse),
    ]
