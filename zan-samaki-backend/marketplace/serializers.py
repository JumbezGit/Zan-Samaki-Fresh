from rest_framework import serializers
from datetime import timedelta
from decimal import Decimal
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
    user = UserSerializer(read_only=True)
    catch = FishCatchSerializer(read_only=True)
    catch_id = serializers.PrimaryKeyRelatedField(
        source='catch',
        queryset=FishCatch.objects.all(),
        write_only=True,
        required=False,
    )
    active_catch = serializers.SerializerMethodField()

    class Meta:
        model = CoolBoxRental
        fields = (
            'id',
            'user',
            'catch',
            'catch_id',
            'active_catch',
            'location',
            'start_date',
            'days',
            'quantity_kg',
            'amount_per_day',
            'price',
            'status',
        )

    def validate(self, attrs):
        request = self.context.get('request')
        catch = attrs.get('catch') or getattr(self.instance, 'catch', None)

        if request is None:
            raise serializers.ValidationError('Ombi hili halikukamilika. Jaribu tena.')

        if request.user.role in {'admin', 'staff'}:
            status_value = attrs.get('status')
            if status_value and status_value not in {'approved', 'rejected'}:
                raise serializers.ValidationError('Admin au staff anaweza kuweka approve au reject tu.')
            quantity_kg = attrs.get('quantity_kg')
            if quantity_kg is not None and quantity_kg <= 0:
                raise serializers.ValidationError('Kilo za kuhifadhi lazima ziwe zaidi ya sifuri.')
            amount_per_day = attrs.get('amount_per_day')
            if amount_per_day is not None and amount_per_day < 0:
                raise serializers.ValidationError('Kiasi cha malipo kwa siku hakiwezi kuwa hasi.')
            return attrs

        if request.user.role != 'fisher':
            raise serializers.ValidationError('Mvuvi pekee ndiye anaweza kuomba coolbox.')

        if catch is None:
            raise serializers.ValidationError('Chagua samaki wa kuhifadhi kwanza.')

        if catch.user_id != request.user.id:
            raise serializers.ValidationError('Unaweza kuomba coolbox kwa samaki wako tu.')

        if not catch.is_approved:
            raise serializers.ValidationError('Samaki lazima waidhinishwe kabla ya kuwekewa coolbox.')

        if catch.status != 'available' or catch.quantity <= 0:
            raise serializers.ValidationError('Samaki hawa hawapo tayari kuhifadhiwa kwenye coolbox.')

        quantity_kg = attrs.get('quantity_kg')
        if quantity_kg is None:
            attrs['quantity_kg'] = catch.quantity
        elif quantity_kg <= 0 or quantity_kg > catch.quantity:
            raise serializers.ValidationError('Kilo za coolbox lazima ziwe zaidi ya sifuri na zisizidi kilo za samaki waliopo.')

        amount_per_day = attrs.get('amount_per_day')
        if amount_per_day is None:
            attrs['amount_per_day'] = Decimal('3000')
        elif amount_per_day < 0:
            raise serializers.ValidationError('Kiasi cha malipo kwa siku hakiwezi kuwa hasi.')

        location = attrs.get('location')
        valid_locations = {choice[0] for choice in CoolBoxRental.LOCATION_CHOICES}
        if location not in valid_locations:
            raise serializers.ValidationError('Chagua eneo sahihi la coolbox.')

        return attrs

    def create(self, validated_data):
        validated_data['price'] = validated_data.get('amount_per_day', Decimal('0')) * validated_data.get('days', 1)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        quantity_kg = validated_data.get('quantity_kg', instance.quantity_kg)
        amount_per_day = validated_data.get('amount_per_day', instance.amount_per_day)
        days = validated_data.get('days', instance.days)
        validated_data['price'] = amount_per_day * days

        if instance.catch and quantity_kg > instance.catch.quantity:
            raise serializers.ValidationError('Kilo za coolbox haziwezi kuzidi kilo za samaki zilizobaki.')

        return super().update(instance, validated_data)

    def get_active_catch(self, obj):
        catch = obj.catch

        if not catch or not catch.is_approved or catch.status != 'available' or catch.quantity <= 0:
            return None

        return FishCatchSerializer(catch, context=self.context).data


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

