from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import FishCatch, Order, CoolBoxRental
from .serializers import (
    FishCatchSerializer, CreateFishCatchSerializer, 
    OrderSerializer, CreateOrderSerializer,
    CoolBoxRentalSerializer, UserSerializer
)

User = get_user_model()

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
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user)

class CoolBoxRentalViewSet(viewsets.ModelViewSet):
    serializer_class = CoolBoxRentalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CoolBoxRental.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

