from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet, ShakeViewSet, TransactionViewSet, StoreViewSet, RestockViewSet

router = DefaultRouter()
router.register('ingredients', IngredientViewSet)
router.register('shakes', ShakeViewSet)
router.register('transactions', TransactionViewSet)
router.register('store', StoreViewSet)
router.register('restocks', RestockViewSet)

urlpatterns = router.urls