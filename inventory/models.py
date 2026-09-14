from django.db import models

class Store(models.Model):
    """Singleton model representing the store's current cash balance."""
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00)

    def __str__(self):
        return f"Store Balance: ₱{self.balance}"

    @classmethod
    def get_instance(cls):
        """Ensures there's always exactly one Store record."""
        store, created = cls.objects.get_or_create(id=1)
        return store

class Ingredient(models.Model):
    name = models.CharField(max_length=50, unique=True)
    stock = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=20, default='kg')
    low_stock_threshold = models.PositiveIntegerField(default=5)

    def __str__(self):
        return f"{self.name} ({self.stock} {self.unit})"

    @property
    def is_low_stock(self):
        return self.stock <= self.low_stock_threshold

class Shake(models.Model):
    name = models.CharField(max_length=50, unique=True)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    ingredients = models.ManyToManyField(Ingredient, through='ShakeIngredient')

    def __str__(self):
        return self.name

    def can_be_made(self):
        """Check if there's enough stock for all ingredients in this shake."""
        for shake_ingredient in self.shakeingredient_set.all():
            if shake_ingredient.ingredient.stock < shake_ingredient.amount_required:
                return False
        return True

class ShakeIngredient(models.Model):
    """Through-model: defines how much of each ingredient a shake needs."""
    shake = models.ForeignKey(Shake, on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    amount_required = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('shake', 'ingredient')

    def __str__(self):
        return f"{self.shake.name} needs {self.amount_required} {self.ingredient.name}"

from django.core.exceptions import ValidationError
from django.utils import timezone

class Transaction(models.Model):
    shake = models.ForeignKey(Shake, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=8, decimal_places=2, editable=False)
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.quantity}x {self.shake.name} - ₱{self.total_price}"

    def clean(self):
        """Validate there's enough stock before allowing this transaction."""
        for shake_ingredient in self.shake.shakeingredient_set.all():
            needed = shake_ingredient.amount_required * self.quantity
            if shake_ingredient.ingredient.stock < needed:
                raise ValidationError(
                    f"Not enough {shake_ingredient.ingredient.name}. "
                    f"Need {needed}, have {shake_ingredient.ingredient.stock}."
                )

    def save(self, *args, **kwargs):
        self.total_price = self.shake.price * self.quantity
        self.full_clean()

        for shake_ingredient in self.shake.shakeingredient_set.all():
            ingredient = shake_ingredient.ingredient
            ingredient.stock -= shake_ingredient.amount_required * self.quantity
            ingredient.save()

        # Add revenue to store balance
        store = Store.get_instance()
        store.balance += self.total_price
        store.save()

        super().save(*args, **kwargs)
        
class Restock(models.Model):
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    amount = models.PositiveIntegerField()
    cost_per_unit = models.DecimalField(max_digits=6, decimal_places=2, default=5.00)
    total_cost = models.DecimalField(max_digits=8, decimal_places=2, editable=False)
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Restocked {self.amount} {self.ingredient.name} for ₱{self.total_cost}"

    def clean(self):
        store = Store.get_instance()
        cost = self.cost_per_unit * self.amount
        if store.balance < cost:
            raise ValidationError(f"Not enough money. Need ₱{cost}, have ₱{store.balance}.")

    def save(self, *args, **kwargs):
        self.total_cost = self.cost_per_unit * self.amount
        self.full_clean()

        store = Store.get_instance()
        store.balance -= self.total_cost
        store.save()

        self.ingredient.stock += self.amount
        self.ingredient.save()

        super().save(*args, **kwargs)