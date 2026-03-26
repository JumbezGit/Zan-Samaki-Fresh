from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.db import transaction
from decimal import Decimal, InvalidOperation
from django.utils import timezone
from datetime import timedelta
from .models import FishCatch, Order, CoolBoxRental, Auction, AuctionBid
from .serializers import (
    FishCatchSerializer, CreateFishCatchSerializer, 
    OrderSerializer, CoolBoxRentalSerializer, UserSerializer, UserCreateSerializer,
    AuctionSerializer, CreateAuctionSerializer
)

User = get_user_model()


class IsMarketplaceAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


def _issue_auth_token(user):
    try:
        from rest_framework_simplejwt.tokens import RefreshToken
        return str(RefreshToken.for_user(user).access_token)
    except ModuleNotFoundError:
        return f'dev-token-{user.id}'


def _settle_expired_auctions():
    cutoff = timezone.now() - timedelta(minutes=1)
    auctions = Auction.objects.select_related('catch', 'highest_bidder', 'seller').filter(
        status='open',
        last_bid_at__isnull=False,
        last_bid_at__lte=cutoff,
    )

    for auction in auctions:
        if auction.highest_bidder and auction.catch.quantity > 0:
            Order.objects.create(
                buyer=auction.highest_bidder,
                catch=auction.catch,
                quantity=auction.catch.quantity,
                total_price=auction.current_price * auction.catch.quantity,
                payment_method='tigo_pesa',
                status='paid',
            )
            auction.catch.quantity = Decimal('0')
            auction.catch.status = 'sold'
            auction.catch.save(update_fields=['quantity', 'status'])
            auction.status = 'sold'
        else:
            auction.catch.status = 'available'
            auction.catch.save(update_fields=['status'])
            auction.status = 'closed'

        auction.closed_at = timezone.now()
        auction.save(update_fields=['status', 'closed_at'])


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = _issue_auth_token(user)
        return Response(
            {
                'auth_token': token,
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username and email:
            user = User.objects.filter(email=email).first()
            username = user.username if user else None

        user = authenticate(request=request, username=username, password=password)
        if not user:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        token = _issue_auth_token(user)
        return Response({'auth_token': token, 'user': UserSerializer(user).data})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            return [IsMarketplaceAdmin()]
        return [AllowAny()]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            if self.request.user.role == 'admin':
                return User.objects.all().order_by('-id')
            return User.objects.filter(id=self.request.user.id)
        return User.objects.none()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='me')
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    def partial_update(self, request, *args, **kwargs):
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response(status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class FishCatchViewSet(viewsets.ModelViewSet):
    queryset = FishCatch.objects.all()
    serializer_class = FishCatchSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            return FishCatchSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CreateFishCatchSerializer
        return FishCatchSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            return FishCatch.objects.select_related('user').order_by('-created_at')
        if self.request.user.role == 'fisher':
            return FishCatch.objects.filter(user=self.request.user)
        return FishCatch.objects.filter(is_approved=True, status='available')

    @action(detail=True, methods=['post'])
    def reserve(self, request, pk=None):
        catch = self.get_object()
        catch.status = 'reserved'
        catch.save()
        return Response({'status': 'reserved'})

    @action(detail=True, methods=['post'])
    def buy(self, request, pk=None):
        with transaction.atomic():
            catch = FishCatch.objects.select_for_update().get(pk=pk)

            try:
                requested_quantity = Decimal(str(request.data.get('quantity', '0')))
            except (InvalidOperation, TypeError):
                return Response(
                    {'detail': 'Kiasi cha kilo si sahihi.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if requested_quantity <= 0:
                return Response(
                    {'detail': 'Kiasi cha kilo lazima kiwe zaidi ya sifuri.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if catch.status != 'available':
                return Response(
                    {'detail': 'Samaki hawa hawapo sokoni kwa sasa.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if requested_quantity > catch.quantity:
                return Response(
                    {'detail': f'Kilo zilizopo ni {catch.quantity} tu.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            total_price = requested_quantity * catch.price_per_kg
            remaining_quantity = catch.quantity - requested_quantity

            order = Order.objects.create(
                buyer=request.user,
                catch=catch,
                quantity=requested_quantity,
                total_price=total_price,
                payment_method=request.data.get('payment_method', 'tigo_pesa')
            )

            catch.quantity = remaining_quantity
            catch.status = 'sold' if remaining_quantity <= Decimal('0') else 'available'
            catch.save(update_fields=['quantity', 'status'])

        return Response(
            {
                **OrderSerializer(order).data,
                'invoice': {
                    'invoice_number': f'INV-{timezone.now().strftime("%Y%m%d")}-{order.id}',
                    'issued_at': timezone.localtime(order.created_at).isoformat(),
                    'buyer_name': request.user.username,
                    'fisher_name': catch.user.username,
                    'fish_title': catch.title,
                    'fish_type': catch.fish_type,
                    'quantity': str(order.quantity),
                    'price_per_kg': str(catch.price_per_kg),
                    'total_price': str(order.total_price),
                    'payment_method': order.payment_method,
                    'status': order.status,
                    'location': catch.location,
                },
                'remaining_quantity': str(catch.quantity),
                'catch_status': catch.status,
            }
        )

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Order.objects.select_related('buyer', 'catch', 'catch__user').order_by('-created_at')
        return Order.objects.filter(buyer=self.request.user)

class CoolBoxRentalViewSet(viewsets.ModelViewSet):
    queryset = CoolBoxRental.objects.all()
    serializer_class = CoolBoxRentalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return CoolBoxRental.objects.select_related('user').order_by('-start_date')
        return CoolBoxRental.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AuctionViewSet(viewsets.ModelViewSet):
    queryset = Auction.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CreateAuctionSerializer
        return AuctionSerializer

    def get_queryset(self):
        _settle_expired_auctions()
        queryset = Auction.objects.select_related('catch', 'seller', 'highest_bidder').prefetch_related('bids__buyer').order_by('-created_at')

        if self.request.user.role == 'fisher':
            return queryset.filter(seller=self.request.user)
        return queryset

    def perform_create(self, serializer):
        catch = serializer.validated_data['catch']

        if self.request.user.role != 'fisher':
            raise permissions.PermissionDenied('Mnada huu ni kwa mvuvi tu.')

        if catch.user_id != self.request.user.id:
            raise permissions.PermissionDenied('Unaweza kuweka mnada kwa samaki wako tu.')

        if catch.status != 'available' or catch.quantity <= 0:
            raise permissions.PermissionDenied('Samaki hawa hawapo tayari kwa mnada.')

        if Auction.objects.filter(catch=catch, status='open').exists():
            raise permissions.PermissionDenied('Samaki hawa tayari wako kwenye mnada unaoendelea.')

        serializer.save(
            seller=self.request.user,
            current_price=serializer.validated_data['initial_price'],
        )
        catch.status = 'reserved'
        catch.save(update_fields=['status'])

    @action(detail=True, methods=['post'])
    def bid(self, request, pk=None):
        _settle_expired_auctions()

        with transaction.atomic():
            auction = Auction.objects.select_for_update().select_related('catch', 'seller', 'highest_bidder').get(pk=pk)

            if request.user.role != 'buyer':
                return Response({'detail': 'Buyer tu anaweza kushiriki mnada.'}, status=status.HTTP_403_FORBIDDEN)

            if auction.status != 'open':
                return Response({'detail': 'Mnada huu umefungwa.'}, status=status.HTTP_400_BAD_REQUEST)

            if auction.seller_id == request.user.id:
                return Response({'detail': 'Huwezi kubid mnada wako mwenyewe.'}, status=status.HTTP_400_BAD_REQUEST)

            recent_competitor_exists = auction.bids.filter(
                created_at__gte=timezone.now() - timedelta(minutes=1)
            ).exclude(buyer=request.user).exists()

            next_amount = auction.current_price
            if recent_competitor_exists or auction.highest_bidder_id:
                next_amount = auction.current_price + auction.increment_gap

            bid = AuctionBid.objects.create(
                auction=auction,
                buyer=request.user,
                amount=next_amount,
            )

            auction.current_price = next_amount
            auction.highest_bidder = request.user
            auction.last_bid_at = timezone.now()
            auction.save(update_fields=['current_price', 'highest_bidder', 'last_bid_at'])

        return Response(
            {
                'detail': 'Bid yako imepokelewa.',
                'auction': AuctionSerializer(auction, context={'request': request}).data,
                'bid_amount': str(bid.amount),
            }
        )

