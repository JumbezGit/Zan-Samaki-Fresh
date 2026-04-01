from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0006_coolboxrental_location'),
    ]

    operations = [
        migrations.AddField(
            model_name='coolboxrental',
            name='amount_per_day',
            field=models.DecimalField(decimal_places=2, default=Decimal('3000'), max_digits=10),
        ),
        migrations.AddField(
            model_name='coolboxrental',
            name='quantity_kg',
            field=models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=10),
        ),
    ]
