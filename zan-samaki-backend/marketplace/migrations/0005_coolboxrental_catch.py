from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0004_merge_20260330_1655'),
    ]

    operations = [
        migrations.AddField(
            model_name='coolboxrental',
            name='catch',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='coolbox_requests',
                to='marketplace.fishcatch',
            ),
        ),
    ]
