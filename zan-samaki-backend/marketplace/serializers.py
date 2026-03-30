from rest_framework import serializers
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import FishCatch, Order, CoolBoxRental, Auction, AuctionBid, SolarCoolBox

User = get_user_model()

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'phone', 'location')

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('Barua pepe hii tayari imetumika.')
        return email

    def validate_username(self, value):
        username = value.strip()
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError('Jina la mtumiaji tayari limetumika.')
        return username

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'buyer'),
            phone=validated_data.get('phone', ''),
            location=validated_data.get('location', 'Zanzibar'),
            is_active=False,
            is_verified=False,
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

class AuctionBidSerializer(serializers.ModelSerializer):
    buyer = UserSerializer(read_only=True)

    class Meta:
        model = AuctionBid
        fields = '__all__'

class AuctionSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)
    highest_bidder = UserSerializer(read_only=True)
    catch = FishCatchSerializer(read_only=True)
    bids = AuctionBidSerializer(read_only=True, many=True)
    bidder_count = serializers.SerializerMethodField()
    bid_expires_at = serializers.SerializerMethodField()
    server_time = serializers.SerializerMethodField()

    class Meta:
        model = Auction
        fields = '__all__'

    def get_bidder_count(self, obj):
        return obj.bids.values('buyer_id').distinct().count()

    def get_bid_expires_at(self, obj):
        if not obj.last_bid_at:
            return None
        return (obj.last_bid_at + timedelta(minutes=1)).isoformat()

    def get_server_time(self, obj):
        snapshot_time = self.context.get('snapshot_time')
        if snapshot_time is None:
            snapshot_time = timezone.now()
        return snapshot_time.isoformat()

class CreateAuctionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auction
        fields = ['catch', 'initial_price', 'increment_gap']

class CoolBoxRentalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoolBoxRental
        fields = '__all__'


class SolarCoolBoxSerializer(serializers.ModelSerializer):
    assigned_staff = UserSerializer(read_only=True)
    assigned_staff_id = serializers.PrimaryKeyRelatedField(
        source='assigned_staff',
        queryset=User.objects.filter(role='staff'),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = SolarCoolBox
        fields = (
            'id',
            'location',
            'condition_status',
            'notes',
            'updated_at',
            'assigned_staff',
            'assigned_staff_id',
        )

