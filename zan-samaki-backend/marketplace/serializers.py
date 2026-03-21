from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FishCatch, Order, CoolBoxRental

User = get_user_model()

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'phone', 'location')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'buyer'),
            phone=validated_data.get('phone', ''),
            location=validated_data.get('location', 'Zanzibar')
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone', 'location')

class FishCatchSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = FishCatch
        fields = '__all__'

class CreateFishCatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = FishCatch
        fields = ['title', 'description', 'fish_type', 'quantity', 'price_per_kg', 'photo', 'voice_note', 'location']
        extra_kwargs = {
            'photo': {'required': False},
            'voice_note': {'required': False},
        }

class OrderSerializer(serializers.ModelSerializer):
    buyer = UserSerializer(read_only=True)
    catch = FishCatchSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'

class CreateOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['catch', 'quantity', 'payment_method']

class CoolBoxRentalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoolBoxRental
        fields = '__all__'

