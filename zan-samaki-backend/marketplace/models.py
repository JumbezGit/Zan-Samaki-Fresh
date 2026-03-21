from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('fisher', 'Fisher'),
        ('buyer', 'Buyer'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='buyer')
    phone = models.CharField(max_length=15, blank=True)
    location = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.username

class FishCatch(models.Model):
    FISH_TYPES = [
        ('Dagaa', 'Dagaa (Sardines)'),
        ('Changu', 'Changu (Kingfish)'),
("Ng'ongo", "Ng'ongo (Snapper)"),
        ('Tafi', 'Tafi (Rabbitfish)'),
        ('Pweza', 'Pweza (Octopus)'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='catches')
    title = models.CharField(max_length=200)
    description = models.TextField()
    fish_type = models.CharField(max_length=20, choices=FISH_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2)
    photo = models.ImageField(upload_to='catches/', blank=True)
    voice_note = models.FileField(upload_to='voice/', blank=True)
    location = models.CharField(max_length=255, default='Zanzibar')
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='available', choices=[
        ('available', 'Available'),
        ('sold', 'Sold'),
        ('reserved', 'Reserved'),
    ])

    def __str__(self):
        return f"{self.title} - {self.fish_type}"

class Order(models.Model):
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    catch = models.ForeignKey(FishCatch, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=[
        ('tigo_pesa', 'Tigo Pesa'),
        ('mpesa', 'M-Pesa'),
    ])
    status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('delivered', 'Delivered'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)

class CoolBoxRental(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_date = models.DateField(default=timezone.now)
    days = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=3000)
    status = models.CharField(max_length=20, default='requested')

