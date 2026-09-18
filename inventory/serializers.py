from rest_framework import serializers
from .models import Ingredient, Shake, ShakeIngredient, Transaction, Store, Restock


class IngredientSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()

    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'stock', 'unit', 'low_stock_threshold', 'cost_per_unit', 'is_low_stock']


class ShakeIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)

    class Meta:
        model = ShakeIngredient
        fields = ['ingredient', 'ingredient_name', 'amount_required']


class ShakeSerializer(serializers.ModelSerializer):
    shakeingredient_set = ShakeIngredientSerializer(many=True, read_only=True)
    can_be_made = serializers.SerializerMethodField()

    class Meta:
        model = Shake
        fields = ['id', 'name', 'price', 'shakeingredient_set', 'can_be_made']

    def get_can_be_made(self, obj):
        return obj.can_be_made()


class TransactionSerializer(serializers.ModelSerializer):
    shake_name = serializers.CharField(source='shake.name', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'shake', 'shake_name', 'quantity', 'total_price', 'timestamp']
        read_only_fields = ['total_price', 'timestamp']


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['id', 'balance']


class RestockSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)

    class Meta:
        model = Restock
        fields = ['id', 'ingredient', 'ingredient_name', 'amount', 'cost_per_unit', 'total_cost', 'timestamp']
        read_only_fields = ['total_cost', 'timestamp']