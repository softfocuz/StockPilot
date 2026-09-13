from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet, ShakeViewSet, TransactionViewSet

router = DefaultRouter()
router.register('ingredients', IngredientViewSet)
router.register('shakes', ShakeViewSet)
router.register('transactions', TransactionViewSet)

urlpatterns = router.urls