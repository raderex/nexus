from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccountViewSet, InvoiceViewSet, ExpenseViewSet, IncomeViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'incomes', IncomeViewSet, basename='income')
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [path('', include(router.urls))]
