from django.contrib import admin
from .models import Ingredient, Shake, ShakeIngredient, Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('shake', 'quantity', 'total_price', 'timestamp')
    readonly_fields = ('total_price',)


class ShakeIngredientInline(admin.TabularInline):
    model = ShakeIngredient
    extra = 1


@admin.register(Shake)
class ShakeAdmin(admin.ModelAdmin):
    list_display = ('name', 'price')
    inlines = [ShakeIngredientInline]