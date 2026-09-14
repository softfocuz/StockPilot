from django.shortcuts import render
from rest_framework import viewsets
from .models import Ingredient, Shake, Transaction, Store, Restock
from .serializers import IngredientSerializer, ShakeSerializer, TransactionSerializer, StoreSerializer, RestockSerializer


class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    http_method_names = ['get']


class ShakeViewSet(viewsets.ModelViewSet):
    queryset = Shake.objects.all()
    serializer_class = ShakeSerializer
    http_method_names = ['get']


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by('-timestamp')
    serializer_class = TransactionSerializer
    http_method_names = ['get', 'post']


class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    http_method_names = ['get']


class RestockViewSet(viewsets.ModelViewSet):
    queryset = Restock.objects.all().order_by('-timestamp')
    serializer_class = RestockSerializer
    http_method_names = ['get', 'post']
