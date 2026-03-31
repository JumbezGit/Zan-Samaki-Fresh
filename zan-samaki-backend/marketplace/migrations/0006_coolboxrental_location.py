from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0005_coolboxrental_catch'),
    ]

    operations = [
        migrations.AddField(
            model_name='coolboxrental',
            name='location',
            field=models.CharField(
                choices=[
                    ('Malindi', 'Malindi'),
                    ('Mkokotoni', 'Mkokotoni'),
                    ('Chwaka', 'Chwaka'),
                    ('Paje', 'Paje'),
                ],
                default='Malindi',
                max_length=20,
            ),
        ),
    ]
