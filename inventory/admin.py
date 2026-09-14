from django.contrib import admin
from .models import Ingredient, Shake, ShakeIngredient, Transaction, Store, Restock


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ('name', 'stock', 'unit', 'is_low_stock')


class ShakeIngredientInline(admin.TabularInline):
    model = ShakeIngredient
    extra = 1


@admin.register(Shake)
class ShakeAdmin(admin.ModelAdmin):
    list_display = ('name', 'price')
    inlines = [ShakeIngredientInline]


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('shake', 'quantity', 'total_price', 'timestamp')
    readonly_fields = ('total_price',)


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('balance',)


@admin.register(Restock)
class RestockAdmin(admin.ModelAdmin):
    list_display = ('ingredient', 'amount', 'cost_per_unit', 'total_cost', 'timestamp')
    readonly_fields = ('total_cost',)