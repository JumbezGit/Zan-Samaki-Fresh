from django.contrib import admin
from .models import User, FishCatch, Order, CoolBoxRental

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'role', 'phone', 'location']
    list_filter = ['role']

@admin.register(FishCatch)
class FishCatchAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'fish_type', 'quantity', 'is_approved', 'status']
    list_filter = ['fish_type', 'is_approved', 'status']
    actions = ['approve_catches']

    def approve_catches(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, 'Selected catches approved.')
    approve_catches.short_description = 'Approve selected catches'

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['catch', 'buyer', 'quantity', 'total_price', 'status']
    list_filter = ['status', 'payment_method']

@admin.register(CoolBoxRental)
class CoolBoxRentalAdmin(admin.ModelAdmin):
    list_display = ['user', 'start_date', 'days', 'status']

