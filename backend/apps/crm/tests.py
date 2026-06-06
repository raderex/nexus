# CRM Module API Tests

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.core.models import Organization, OrganizationMember
from .models import Pipeline, Contact, Deal, Activity
from django.test import TestCase

User = get_user_model()


class CRMModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='testpass123'
        )
        self.org = Organization.objects.create(
            name='Test Org CRM', slug='test-org-crm', email='crm@test.com'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.user, role='owner'
        )
        self.pipeline = Pipeline.objects.create(
            organization=self.org,
            name='Sales',
            stages=[
                {'id': 'new', 'name': 'New', 'color': '#6366f1'},
                {'id': 'qualified', 'name': 'Qualified', 'color': '#8b5cf6'},
                {'id': 'proposal', 'name': 'Proposal', 'color': '#f59e0b'},
                {'id': 'won', 'name': 'Won', 'color': '#10b981'}
            ],
            is_default=True
        )
        self.contact = Contact.objects.create(
            organization=self.org,
            first_name='John',
            last_name='Doe',
            email='john@company.com',
            phone='+123456789',
            type='lead',
            status='active',
            assigned_to=self.user
        )
        self.deal = Deal.objects.create(
            organization=self.org,
            title='Enterprise License',
            contact=self.contact,
            pipeline=self.pipeline,
            stage='qualified',
            status='open',
            value=5000.0,
            currency='USD',
            assigned_to=self.user
        )
        self.activity = Activity.objects.create(
            organization=self.org,
            activity_type='call',
            subject='Follow-up with John',
            description='Discussed proposal. Scheduled demo.',
            status='scheduled',
            assigned_to=self.user,
            contact=self.contact,
            deal=self.deal
        )

    def test_pipeline_creation(self):
        self.assertEqual(len(self.pipeline.stages), 4)
        self.assertTrue(self.pipeline.is_default)

    def test_contact_full_name(self):
        self.assertEqual(self.contact.get_full_name(), "John Doe")
        self.assertEqual(self.contact.type, 'lead')

    def test_deal_currency(self):
        self.assertEqual(float(self.deal.value), 5000.0)


class CRMAPIEndpointTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='testpass123'
        )
        self.org = Organization.objects.create(
            name='Test Org CRM', slug='test-org-crm', email='crm@test.com'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.user, role='owner'
        )
        self.pipeline = Pipeline.objects.create(
            organization=self.org,
            name='Sales',
            stages=[
                {'id': 'new', 'name': 'New', 'color': '#6366f1'},
                {'id': 'qualified', 'name': 'Qualified', 'color': '#8b5cf6'},
                {'id': 'proposal', 'name': 'Proposal', 'color': '#f59e0b'},
                {'id': 'won', 'name': 'Won', 'color': '#10b981'}
            ],
            is_default=True
        )
        self.contact = Contact.objects.create(
            organization=self.org,
            first_name='John',
            last_name='Doe',
            email='john@company.com',
            type='lead',
            status='active',
            assigned_to=self.user
        )
        self.deal = Deal.objects.create(
            organization=self.org,
            title='Enterprise License',
            contact=self.contact,
            pipeline=self.pipeline,
            stage='qualified',
            status='open',
            value=5000.0,
            currency='USD',
            assigned_to=self.user
        )
        self.activity = Activity.objects.create(
            organization=self.org,
            contact=self.contact,
            deal=self.deal,
            activity_type='call',
            subject='Follow-up call',
            description='Discussed proposal',
            status='pending',
            assigned_to=self.user
        )
        self.client.force_authenticate(user=self.user)

    def assertResponseStatus(self, response, expected, msg=None):
        if msg is None:
            msg = f"Expected {expected}, got {response.status_code}"
        self.assertEqual(response.status_code, expected, msg)

    # Pipeline API
    def test_pipeline_list(self):
        url = reverse('pipeline-list')
        response = self.client.get(url)
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

    def test_pipeline_create(self):
        url = reverse('pipeline-list')
        data = {
            "name": "New Pipeline",
            "stages": [
                {"id": "new", "name": "New", "color": "#ef4444"},
                {"id": "closed", "name": "Closed", "color": "#8b5cf6"}
            ],
            "is_default": False
        }
        response = self.client.post(url, data, format='json')
        self.assertResponseStatus(response, status.HTTP_201_CREATED)

    # Contact API
    def test_contact_list(self):
        url = reverse('contact-list')
        response = self.client.get(url)
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

    def test_contact_detail(self):
        url = reverse('contact-detail', args=[self.contact.id])
        response = self.client.get(url)
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], "John")

    def test_contact_create(self):
        url = reverse('contact-list')
        data = {
            "first_name": "Anna", "last_name": "Smith", "email": "anna@test.com",
            "phone": "+987654321", "type": "lead", "status": "active"
        }
        response = self.client.post(url, data, format='json')
        self.assertResponseStatus(response, status.HTTP_201_CREATED)
        self.assertEqual(response.data['first_name'], "Anna")

    # Deal API
    def test_deal_list(self):
        url = reverse('deal-list')
        response = self.client.get(url)
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

    def test_deal_pipeline_summary(self):
        url = reverse('deal-pipeline-summary')
        response = self.client.get(url)
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.assertIn('by_stage', response.data)
        self.assertIn('total_open', response.data)
        self.assertIn('total_won', response.data)

    # Activity API
    def test_activity_list(self):
        url = reverse('activity-list')
        response = self.client.get(url)
        self.assertResponseStatus(response, status.HTTP_200_OK)

    def test_activity_complete(self):
        url = reverse('activity-complete', args=[self.activity.id])
        response = self.client.post(url)
        self.assertResponseStatus(response, status.HTTP_200_OK)
        self.activity.refresh_from_db()
        self.assertEqual(self.activity.status, 'completed')

    # Permissions

    def test_viewer_cannot_create_deal(self):
        viewer = User.objects.create_user(
            username='viewer', email='viewer@test.com', password='viewerpass123'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=viewer, role='viewer'
        )
        self.client.force_authenticate(user=viewer)
        url = reverse('deal-list')
        data = {
            "title": "Unauthorized Deal",
            "contact": self.contact.id,
            "pipeline": self.pipeline.id,
            "stage": "new",
            "status": "open",
            "value": 1000.0
        }
        response = self.client.post(url, data, format='json')
        self.assertResponseStatus(response, status.HTTP_403_FORBIDDEN)