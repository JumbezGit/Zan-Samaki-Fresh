from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'catches', views.FishCatchViewSet)
router.register(r'orders', views.OrderViewSet)
router.register(r'coolbox', views.CoolBoxRentalViewSet)
router.register(r'solar-coolboxes', views.SolarCoolBoxViewSet, basename='solar-coolbox')
router.register(r'auctions', views.AuctionViewSet)

urlpatterns = [
    path('auth/jwt/login/', views.LoginView.as_view()),
    path('auth/jwt/register/', views.RegisterView.as_view()),
    path('', include(router.urls)),
]

