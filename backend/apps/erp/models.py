from django.db import models
from django.core.validators import MinValueValidator
import uuid


class Account(models.Model):
    ACCOUNT_TYPE = [('asset','Asset'),('liability','Liability'),('equity','Equity'),('revenue','Revenue'),('expense','Expense')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=255)
    account_type = models.CharField(max_length=50, choices=ACCOUNT_TYPE)
    code = models.CharField(max_length=50, blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts'

    def __str__(self):
        return f"{self.code} - {self.name}"


class Invoice(models.Model):
    STATUS = [('draft','Draft'),('sent','Sent'),('paid','Paid'),('overdue','Overdue'),('cancelled','Cancelled')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=100, unique=True)
    client = models.ForeignKey('crm.Contact', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    issue_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=50, choices=STATUS, default='draft')
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')
    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'

    def __str__(self):
        return self.invoice_number


class InvoiceItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.TextField()
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    class Meta:
        db_table = 'invoice_items'


class Expense(models.Model):
    STATUS = [('pending','Pending'),('approved','Approved'),('rejected','Rejected'),('reimbursed','Reimbursed')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='expenses')
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='USD')
    date = models.DateField()
    vendor = models.CharField(max_length=255, blank=True)
    receipt = models.FileField(upload_to='receipts/', null=True, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=50, choices=STATUS, default='pending')
    employee = models.ForeignKey('hrm.Employee', on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='erp_expenses')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expenses'

    def __str__(self):
        return f"{self.category} - {self.amount}"


class Income(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='incomes')
    source = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='USD')
    date = models.DateField()
    client = models.ForeignKey('crm.Contact', on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='erp_incomes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'incomes'

    def __str__(self):
        return f"{self.source} - {self.amount}"


class Transaction(models.Model):
    TYPE = [('income','Income'),('expense','Expense'),('transfer','Transfer')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='transactions')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=50, choices=TYPE)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    date = models.DateField()
    description = models.TextField(blank=True)
    reference = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transactions'
