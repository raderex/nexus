from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum
from .models import Account, Invoice, InvoiceItem, Expense, Income, Transaction
from .serializers import AccountSerializer, InvoiceSerializer, ExpenseSerializer, IncomeSerializer, TransactionSerializer
from apps.core.permissions import IsOrgEditorOrReadOnly, IsOrgAdmin, IsOrgMember


class AccountViewSet(viewsets.ModelViewSet):
    """Financial accounts - editors can manage, viewers read-only."""
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    def get_queryset(self):
        return Account.objects.filter(organization__members__user=self.request.user).order_by('-created_at').distinct()
    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org)


class InvoiceViewSet(viewsets.ModelViewSet):
    """Invoices - editors can create/update, only admins can delete."""
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status']
    search_fields = ['invoice_number']
    def get_queryset(self):
        return Invoice.objects.filter(organization__members__user=self.request.user).order_by('-created_at').distinct()
    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org, created_by=self.request.user)
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOrgEditorOrReadOnly])
    def mark_paid(self, request, pk=None):
        inv = self.get_object(); inv.status = 'paid'; inv.save()
        return Response(InvoiceSerializer(inv).data)
    @action(detail=False, methods=['get'])
    def summary(self, request):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        qs = Invoice.objects.filter(organization=org)
        return Response({
            'total': float(qs.aggregate(s=Sum('total'))['s'] or 0),
            'paid': float(qs.filter(status='paid').aggregate(s=Sum('total'))['s'] or 0),
            'outstanding': float(qs.filter(status__in=['sent','overdue']).aggregate(s=Sum('total'))['s'] or 0),
            'draft': qs.filter(status='draft').count(),
        })


class ExpenseViewSet(viewsets.ModelViewSet):
    """Expenses - editors can submit, admins can approve/reject/delete."""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'category']
    def get_queryset(self):
        return Expense.objects.filter(organization__members__user=self.request.user).order_by('-created_at').distinct()
    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org, created_by=self.request.user)
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOrgAdmin])
    def approve(self, request, pk=None):
        """Only admins/owners can approve expenses."""
        exp = self.get_object(); exp.status = 'approved'; exp.save()
        return Response(ExpenseSerializer(exp).data)
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOrgAdmin])
    def reject(self, request, pk=None):
        """Only admins/owners can reject expenses."""
        exp = self.get_object(); exp.status = 'rejected'; exp.save()
        return Response(ExpenseSerializer(exp).data)


class IncomeViewSet(viewsets.ModelViewSet):
    """Income records - editors can manage, viewers read-only."""
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    def get_queryset(self):
        return Income.objects.filter(organization__members__user=self.request.user).order_by('-created_at').distinct()
    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org, created_by=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    """Transactions - editors can manage, viewers read-only."""
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['transaction_type']
    def get_queryset(self):
        return Transaction.objects.filter(organization__members__user=self.request.user).order_by('-created_at').distinct()
    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org)
