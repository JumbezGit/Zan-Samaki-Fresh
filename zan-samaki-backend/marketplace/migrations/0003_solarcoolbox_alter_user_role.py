from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def seed_solar_coolboxes(apps, schema_editor):
    SolarCoolBox = apps.get_model('marketplace', 'SolarCoolBox')

    for location in ['Malindi', 'Mkokotoni', 'Chwaka', 'Paje']:
        SolarCoolBox.objects.get_or_create(location=location)


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0002_auction_auctionbid'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[('fisher', 'Fisher'), ('buyer', 'Buyer'), ('staff', 'Staff'), ('admin', 'Admin')],
                default='buyer',
                max_length=10,
            ),
        ),
        migrations.CreateModel(
            name='SolarCoolBox',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('location', models.CharField(choices=[('Malindi', 'Malindi'), ('Mkokotoni', 'Mkokotoni'), ('Chwaka', 'Chwaka'), ('Paje', 'Paje')], max_length=20, unique=True)),
                ('condition_status', models.CharField(choices=[('good', 'Good'), ('bad', 'Bad'), ('broken', 'Broken')], default='good', max_length=10)),
                ('notes', models.TextField(blank=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('assigned_staff', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_coolboxes', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.RunPython(seed_solar_coolboxes, migrations.RunPython.noop),
    ]
