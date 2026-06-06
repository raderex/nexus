# ERP Module API Tests

from django.urls import reverse
from rest_framework.test import APITestCase
from django.test import TestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.core.models import Organization, OrganizationMember
from .models import Account, Invoice, Expense, Income, Transaction

User = get_user_model()


class ERPModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='testpass123'
        )
        self.org = Organization.objects.create(
            name='Test Org ERP', slug='test-org-erp', email='erp@test.com'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.user, role='owner'
        )
        self.account = Account.objects.create(
            organization=self.org,
            name='Test Bank',
            account_type='asset',
            balance=1000.0,
            currency='USD'
        )
        self.invoice = Invoice.objects.create(
            organization=self.org,
            created_by=self.user,
            invoice_number='INV-001',
            status='sent',
            total=100.0,
            issue_date='2026-06-06',
            due_date='2026-07-06'
        )
        self.expense = Expense.objects.create(
            organization=self.org,
            created_by=self.user,
            amount=50.0,
            category='office',
            date='2026-06-06',
            status='pending',
            notes='Office supplies'
        )
        self.income = Income.objects.create(
            organization=self.org,
            created_by=self.user,
            source='Service',
            amount=200.0,
            currency='USD',
            date='2026-06-06',
            notes='Service fee'
        )
        self.transaction = Transaction.objects.create(
            organization=self.org,
            account=self.account,
            amount=100.0,
            transaction_type='expense',
            date='2026-06-06',
            description='Invoice payment'
        )

    def test_account_creation(self):
        self.assertEqual(self.account.name, 'Test Bank')
        self.assertEqual(float(self.account.balance), 1000.0)

    def test_invoice_creation(self):
        self.assertEqual(self.invoice.invoice_number, 'INV-001')
        self.assertEqual(float(self.invoice.total), 100.0)

    def test_expense_status(self):
        self.assertEqual(self.expense.status, 'pending')


class ERPAPIEndpointTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='testpass123'
        )
        self.org = Organization.objects.create(
            name='Test Org ERP', slug='test-org-erp', email='erp@test.com'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.user, role='owner'
        )
        self.account = Account.objects.create(
            organization=self.org,
            name='Test Bank',
            account_type='asset',
            balance=1000.0,
            currency='USD'
        )
        self.invoice = Invoice.objects.create(
            organization=self.org,
            created_by=self.user,
            invoice_number='INV-001',
            status='sent',
            total=100.0,
            issue_date='2026-06-06',
            due_date='2026-07-06'
        )
        self.expense = Expense.objects.create(
            organization=self.org,
            created_by=self.user,
            amount=50.0,
            category='office',
            date='2026-06-06',
            status='pending',
            notes='Office supplies'
        )
        self.income = Income.objects.create(
            organization=self.org,
            created_by=self.user,
            source='Service',
            amount=200.0,
            currency='USD',
            date='2026-06-06',
        )
        self.client.force_authenticate(user=self.user)

    def assertResponseStatus(self, response, expected, msg=None):
        if msg is None:
            msg = f"Expected {expected}, got {response.status_code}"
        self.assertEqual(response.status_code, expected, msg)

    # Account API

    def test_account_list(self):
        url = reverse('account-list')
        response = self.client.get(url, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_account_detail(self):
        url = reverse('account-detail', args=[self.account.id])
        response = self.client.get(url, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Bank')

    def test_account_create(self):
        url = reverse('account-list')
        data = {
            "name": "New Account",
            "account_type": "asset",
                        "balance": 2000.0,
            "currency": "USD"
        }
        response = self.client.post(url, data, format='json')
        self.assertResponseStatus(response, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "New Account")

    def test_account_update(self):
        url = reverse('account-detail', args=[self.account.id])
        data = {"balance": 1200.0}
        response = self.client.patch(url, data, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.account.refresh_from_db()
        self.assertEqual(float(self.account.balance), 1200.0)

    def test_account_delete(self):
        url = reverse('account-detail', args=[self.account.id])
        response = self.client.delete(url, format='json')
        self.assertResponseStatus(response, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Account.objects.filter(id=self.account.id).exists())

    # Invoice API

    def test_invoice_list(self):
        url = reverse('invoice-list')
        response = self.client.get(url, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_invoice_mark_paid(self):
        url = reverse('invoice-mark-paid', args=[self.invoice.id])
        response = self.client.post(url, {}, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, 'paid')

    def test_invoice_summary(self):
        url = reverse('invoice-summary')
        response = self.client.get(url, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.assertIn('total', response.data)

    def test_invoice_update(self):
        url = reverse('invoice-detail', args=[self.invoice.id])
        data = {"notes": "Updated invoice notes"}
        response = self.client.patch(url, data, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.notes, "Updated invoice notes")

    def test_invoice_delete(self):
        url = reverse('invoice-detail', args=[self.invoice.id])
        response = self.client.delete(url, format='json')
        self.assertResponseStatus(response, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Invoice.objects.filter(id=self.invoice.id).exists())

    # Expense API

    def test_expense_approve(self):
        url = reverse('expense-approve', args=[self.expense.id])
        response = self.client.post(url, {}, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.expense.refresh_from_db()
        self.assertEqual(self.expense.status, 'approved')

    def test_expense_reject(self):
        url = reverse('expense-reject', args=[self.expense.id])
        response = self.client.post(url, {}, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.expense.refresh_from_db()
        self.assertEqual(self.expense.status, 'rejected')

    # Income API

    def test_income_create(self):
        url = reverse('income-list')
        data = {
            "source": "Consulting",
            "amount": 500.0,
            "currency": "USD",
            "date": "2026-06-07",
            "notes": "Consulting fee"
        }
        response = self.client.post(url, data, format='json')
        self.assertResponseStatus(response, status.HTTP_201_CREATED)
        self.assertEqual(response.data['source'], "Consulting")

    def test_income_update(self):
        url = reverse('income-detail', args=[self.income.id])
        data = {"notes": "Updated fee"}
        response = self.client.patch(url, data, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.income.refresh_from_db()
        self.assertEqual(self.income.notes, "Updated fee")

    def test_income_delete(self):
        url = reverse('income-detail', args=[self.income.id])
        response = self.client.delete(url, format='json')
        self.assertResponseStatus(response, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Income.objects.filter(id=self.income.id).exists())

    # Permissions

    def test_non_owner_cannot_create(self):
        # Existing test ensures a viewer cannot create an Account
        viewer = User.objects.create_user(
            username='viewer', email='viewer@test.com', password='testpass123'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=viewer, role='viewer'
        )
        self.client.force_authenticate(user=viewer)
        url = reverse('account-list')
        data = {
            "name": "Unauthorized Account",
            "account_type": "asset",
            "balance": 3000.0,
            "currency": "USD"
        }
        response = self.client.post(url, data, format='json')
        self.assertResponseStatus(response, status.HTTP_403_FORBIDDEN)

    def test_viewer_cannot_create_invoice(self):
        # Viewer should not be allowed to POST a new invoice
        viewer = User.objects.create_user(
            username='viewer2', email='viewer2@test.com', password='testpass123'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=viewer, role='viewer'
        )
        self.client.force_authenticate(user=viewer)
        url = reverse('invoice-list')
        data = {
            "invoice_number": "INV-002",
            "total": 150.0,
            "issue_date": "2026-06-07",
            "due_date": "2026-07-07"
        }
        response = self.client.post(url, data, format='json')
        self.assertResponseStatus(response, status.HTTP_403_FORBIDDEN)

    def test_viewer_cannot_approve_expense(self):
        # Approve action requires admin; viewer should get 403
        viewer = User.objects.create_user(
            username='viewer3', email='viewer3@test.com', password='testpass123'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=viewer, role='viewer'
        )
        self.client.force_authenticate(user=viewer)
        url = reverse('expense-approve', args=[self.expense.id])
        response = self.client.post(url, {}, format='json')
        self.assertResponseStatus(response, status.HTTP_403_FORBIDDEN)

    def test_invoice_summary_action(self):
        # Summary custom action should be accessible and return expected keys
        url = reverse('invoice-summary')
        response = self.client.get(url, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        for key in ['total', 'paid', 'outstanding', 'draft']:
            self.assertIn(key, response.data)
        viewer = User.objects.create_user(
            username='viewer', email='viewer@test.com', password='testpass123'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=viewer, role='viewer'
        )
        self.client.force_authenticate(user=viewer)
        url = reverse('account-list')
        data = {
            "name": "Unauthorized Account",
            "account_type": "asset",
            "balance": 3000.0,
            "currency": "USD"
        }
        response = self.client.post(url, data, format='json')
        self.assertResponseStatus(response, status.HTTP_403_FORBIDDEN)