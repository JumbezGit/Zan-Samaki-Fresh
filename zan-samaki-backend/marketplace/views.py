from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from .models import FishCatch, Order, CoolBoxRental
from .serializers import (
    FishCatchSerializer, CreateFishCatchSerializer, 
    OrderSerializer, CoolBoxRentalSerializer, UserSerializer, UserCreateSerializer
)

User = get_user_model()


def _issue_auth_token(user):
    try:
        from rest_framework_simplejwt.tokens import RefreshToken
        return str(RefreshToken.for_user(user).access_token)
    except ModuleNotFoundError:
        return f'dev-token-{user.id}'


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

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return User.objects.filter(id=self.request.user.id)
        return User.objects.none()

class FishCatchViewSet(viewsets.ModelViewSet):
    queryset = FishCatch.objects.filter(is_approved=True, status='available')
    serializer_class = FishCatchSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CreateFishCatchSerializer
        return FishCatchSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
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
        catch = self.get_object()
        order = Order.objects.create(
            buyer=request.user,
            catch=catch,
            quantity=catch.quantity,
            total_price=float(catch.quantity * catch.price_per_kg),
            payment_method=request.data.get('payment_method', 'tigo_pesa')
        )
        catch.status = 'sold'
        catch.save()
        return Response(OrderSerializer(order).data)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user)

class CoolBoxRentalViewSet(viewsets.ModelViewSet):
    queryset = CoolBoxRental.objects.all()
    serializer_class = CoolBoxRentalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CoolBoxRental.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

