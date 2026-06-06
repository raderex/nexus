# HRM Module API Tests

from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.core.models import Organization, OrganizationMember
from .models import (
    Department, Employee, Payroll, Attendance, LeaveType,
    LeaveBalance, LeaveRequest, PerformanceGoal, PerformanceReview, Asset
)

User = get_user_model()


class HRMModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='hruser', email='hr@test.com', password='testpass123'
        )
        self.org = Organization.objects.create(
            name='HR Test Org', slug='hr-test', email='hr@test.com'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.user, role='owner'
        )
        self.department = Department.objects.create(
            organization=self.org,
            name='Engineering'
        )
        self.employee = Employee.objects.create(
            organization=self.org,
            user=self.user,
            employee_code='EMP001',
            department=self.department,
            employment_type='full_time',
            job_title='Developer',
            salary=6000,
            hire_date='2024-01-01'
        )
        self.leave_type = LeaveType.objects.create(
            organization=self.org,
            name='Annual Leave',
            days_per_year=20
        )
        self.leave_balance = LeaveBalance.objects.create(
            employee=self.employee,
            leave_type=self.leave_type,
            year=2026,
            allocated=20,
            used=0,
            pending=0
        )
        self.leave_request = LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.leave_type,
            start_date='2026-06-10',
            end_date='2026-06-15',
            days=5,
            status='pending',
            reason='Vacation'
        )

    def test_employee_creation(self):
        self.assertEqual(self.employee.employee_code, 'EMP001')
        self.assertEqual(self.employee.job_title, 'Developer')

    def test_leave_balance(self):
        self.assertEqual(self.leave_balance.allocated, 20)
        self.assertEqual(self.leave_balance.used, 0)


class HRMAPIEndpointTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='hruser', email='hr@test.com', password='testpass123'
        )
        self.org = Organization.objects.create(
            name='HR Test Org', slug='hr-test', email='hr@test.com'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.user, role='owner'
        )
        self.department = Department.objects.create(
            organization=self.org,
            name='Engineering'
        )
        self.employee = Employee.objects.create(
            organization=self.org,
            user=self.user,
            employee_code='EMP001',
            department=self.department,
            employment_type='full_time',
            job_title='Developer',
            salary=6000,
            hire_date='2024-01-01'
        )
        self.leave_type = LeaveType.objects.create(
            organization=self.org,
            name='Annual Leave',
            days_per_year=20
        )
        self.leave_balance = LeaveBalance.objects.create(
            employee=self.employee,
            leave_type=self.leave_type,
            year=2026,
            allocated=20,
            used=0,
            pending=0
        )
        self.leave_request = LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.leave_type,
            start_date='2026-06-10',
            end_date='2026-06-15',
            days=5,
            status='pending',
            reason='Vacation'
        )
        self.client.force_authenticate(user=self.user)

    def assertResponseStatus(self, response, expected, msg=None):
        if msg is None:
            msg = f"Expected {expected}, got {response.status_code}"
        self.assertEqual(response.status_code, expected, msg)

    # Employee API

    def test_employee_list(self):
        url = reverse('employee-list')
        response = self.client.get(url)
        self.assertResponseStatus(response, status.HTTP_200_OK)

    def test_employee_attendance_summary(self):
        url = reverse('employee-attendance-summary', args=[self.employee.id])
        response = self.client.get(url)
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.assertIsInstance(response.data['present'], int)

    # LeaveRequest API

    def test_leave_request_approve(self):
        self.client.logout()
        admin_user = User.objects.create_user(
            username='admin', email='admin@test.com', password='adminpass123'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=admin_user, role='admin'
        )
        self.client.force_authenticate(user=admin_user)
        url = reverse('leaverequest-approve', args=[self.leave_request.id])
        response = self.client.post(url)
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.leave_request.refresh_from_db()
        self.assertEqual(self.leave_request.status, 'approved')

    def test_leave_request_reject(self):
        self.client.logout()
        admin_user = User.objects.create_user(
            username='admin', email='admin@test.com', password='adminpass123'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=admin_user, role='admin'
        )
        self.client.force_authenticate(user=admin_user)
        url = reverse('leaverequest-reject', args=[self.leave_request.id])
        response = self.client.post(url)
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.leave_request.refresh_from_db()
        self.assertEqual(self.leave_request.status, 'rejected')

    # Attendance API

    def test_attendance_today_summary(self):
        url = reverse('attendance-today-summary')
        response = self.client.get(url)
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.assertIn('total_employees', response.data)
        self.assertIn('present', response.data)

    def test_attendance_bulk_mark(self):
        self.client.logout()
        admin_user = User.objects.create_user(
            username='admin2', email='admin2@test.com', password='adminpass123'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=admin_user, role='admin'
        )
        self.client.force_authenticate(user=admin_user)
        url = reverse('attendance-bulk-mark')
        response = self.client.post(url, {'status': 'present'}, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.assertIn('marked', response.data)

    # Asset API

    def test_asset_assign(self):
        asset = Asset.objects.create(
            organization=self.org,
            name='MacBook Pro',
            asset_tag='MBP001',
            category='Laptop',
            status='available'
        )
        url = reverse('asset-assign', args=[asset.id])
        response = self.client.post(url, {'employee_id': str(self.employee.id)}, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        asset.refresh_from_db()
        self.assertEqual(asset.status, 'assigned')
        self.assertEqual(asset.assigned_to, self.employee)

    def test_asset_unassign(self):
        asset = Asset.objects.create(
            organization=self.org,
            name='MacBook Pro',
            asset_tag='MBP002',
            category='Laptop',
            status='assigned',
            assigned_to=self.employee
        )
        url = reverse('asset-unassign', args=[asset.id])
        response = self.client.post(url, format='json')
        self.assertResponseStatus(response, status.HTTP_200_OK)
        asset.refresh_from_db()
        self.assertEqual(asset.status, 'available')
        self.assertIsNone(asset.assigned_to)

    # Payroll API

    def test_payroll_summary(self):
        url = reverse('payroll-summary')
        response = self.client.get(url)
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.assertIn('total_gross', response.data)

    # Permissions

    def test_viewer_cannot_create_employee(self):
        viewer = User.objects.create_user(
            username='viewer', email='viewer@test.com', password='viewerpass123'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=viewer, role='viewer'
        )
        self.client.force_authenticate(user=viewer)
        url = reverse('employee-list')
        data = {
            "user": self.user.id, "employee_code": "EMP002",
            "employment_type": "part_time", "job_title": "Intern", "salary": 2000
        }
        response = self.client.post(url, data)
        self.assertResponseStatus(response, status.HTTP_403_FORBIDDEN)