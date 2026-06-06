from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Organization, OrganizationMember

User = get_user_model()

class CoreAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='apiuser', email='api@test.com', password='testpass123'
        )
        self.org = Organization.objects.create(
            name='API Test Org', slug='api-test-org', email='api@test.com'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.user, role='owner'
        )
        self.client.force_authenticate(user=self.user)

    def test_health_check(self):
        url = reverse('health-check')
        resp = self.client.get(url)
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])
        self.assertIn('status', resp.data)

    def test_organization_list(self):
        url = reverse('organization-list')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_user_me(self):
        url = reverse('user-me')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['email'], 'api@test.com')

    def test_register_user(self):
        self.client.logout()
        url = reverse('register')
        data = {
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'testpass123',
            'first_name': 'New',
            'last_name': 'User',
        }
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['email'], 'new@test.com')

    def test_unauthenticated_access_blocked(self):
        self.client.logout()
        url = reverse('organization-list')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class OrganizationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.org = Organization.objects.create(
            name='Test Org',
            slug='test-org',
            email='org@test.com'
        )
        OrganizationMember.objects.create(
            organization=self.org,
            user=self.user,
            role='owner'
        )

    def test_organization_creation(self):
        self.assertEqual(self.org.name, 'Test Org')
        self.assertTrue(self.org.is_active)

    def test_member_association(self):
        self.assertEqual(self.org.members.count(), 1)
        self.assertEqual(self.org.members.first().role, 'owner')
