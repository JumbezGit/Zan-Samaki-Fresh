from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'catches', views.FishCatchViewSet)
router.register(r'orders', views.OrderViewSet)
router.register(r'coolbox', views.CoolBoxRentalViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

