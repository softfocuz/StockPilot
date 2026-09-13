from django.shortcuts import render
from rest_framework import viewsets
from .models import Ingredient, Shake, Transaction
from .serializers import IngredientSerializer, ShakeSerializer, TransactionSerializer


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
