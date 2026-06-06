# Social Module API Tests

from django.urls import reverse
from rest_framework.test import APITestCase
from django.test import TestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.core.models import Organization, OrganizationMember
from .models import (
    SocialAccount, SocialPost, SocialMessage, Campaign,
    MediaFile, PostAnalytic, Hashtag, PostQueue, Webhook
)

User = get_user_model()


class SocialModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='socialuser', email='social@test.com', password='testpass123'
        )
        self.org = Organization.objects.create(
            name='Social Test Org', slug='social-test-org'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.user, role='owner'
        )
        self.account = SocialAccount.objects.create(
            organization=self.org, platform='twitter',
            account_name='Test Account', is_connected=True
        )
        self.post = SocialPost.objects.create(
            organization=self.org, author=self.user,
            content='Hello world', platforms=['twitter'], status='draft'
        )
        self.message = SocialMessage.objects.create(
            organization=self.org, social_account=self.account,
            sender_name='John', content='Hi there',
            message_type='dm', received_at='2026-06-06T10:00:00Z'
        )
        self.campaign = Campaign.objects.create(
            organization=self.org, name='Test Campaign',
            objective='awareness', start_date='2026-06-01', end_date='2026-06-30',
            created_by=self.user
        )
        self.media = MediaFile.objects.create(
            organization=self.org, uploaded_by=self.user,
            filename='test.png', file_type='image', size_bytes=1024
        )
        self.analytic = PostAnalytic.objects.create(
            post=self.post, social_account=self.account,
            impressions=100, likes=10
        )
        self.webhook = Webhook.objects.create(
            organization=self.org, event_type='new_message',
            target_url='https://example.com/webhook'
        )
        self.hashtag = Hashtag.objects.create(
            organization=self.org, tag='test', platform='instagram',
            usage_count=50
        )
        self.queue = PostQueue.objects.create(
            post=self.post, social_account=self.account,
            scheduled_at='2026-06-07T10:00:00Z'
        )

    def test_account_creation(self):
        self.assertEqual(self.account.platform, 'twitter')

    def test_post_creation(self):
        self.assertEqual(self.post.status, 'draft')

    def test_message_creation(self):
        self.assertEqual(self.message.sender_name, 'John')

    def test_campaign_creation(self):
        self.assertEqual(self.campaign.objective, 'awareness')

    def test_media_creation(self):
        self.assertEqual(self.media.filename, 'test.png')

    def test_analytic_creation(self):
        self.assertEqual(self.analytic.impressions, 100)

    def test_webhook_creation(self):
        self.assertEqual(self.webhook.event_type, 'new_message')

    def test_hashtag_creation(self):
        self.assertEqual(self.hashtag.tag, 'test')

    def test_queue_creation(self):
        self.assertEqual(self.queue.status, 'waiting')


class SocialAPIEndpointTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner', email='owner@social.com', password='ownerpass'
        )
        self.org = Organization.objects.create(
            name='Social Org', slug='social-org'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.owner, role='owner'
        )
        self.account = SocialAccount.objects.create(
            organization=self.org, platform='twitter',
            account_name='Test', is_connected=True
        )
        self.post = SocialPost.objects.create(
            organization=self.org, author=self.owner,
            content='Test post', platforms=['twitter'], status='draft'
        )
        self.message = SocialMessage.objects.create(
            organization=self.org, social_account=self.account,
            sender_name='Alice', content='Hello',
            message_type='dm', received_at='2026-06-06T10:00:00Z'
        )
        self.campaign = Campaign.objects.create(
            organization=self.org, name='Campaign',
            objective='engagement', start_date='2026-06-01',
            end_date='2026-06-30', created_by=self.owner
        )
        self.client.force_authenticate(user=self.owner)

    def assertResponseStatus(self, response, expected, msg=None):
        if msg is None:
            msg = f"Expected {expected}, got {response.status_code}"
        self.assertEqual(response.status_code, expected, msg)

    # Accounts
    def test_account_list(self):
        url = reverse('socialaccount-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_account_overview(self):
        url = reverse('socialaccount-overview')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertIn('total_accounts', resp.data)

    def test_account_sync(self):
        url = reverse('socialaccount-sync', args=[self.account.id])
        resp = self.client.post(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertEqual(resp.data['status'], 'synced')

    # Posts
    def test_post_list(self):
        url = reverse('socialpost-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_post_create(self):
        url = reverse('socialpost-list')
        data = {'content': 'New post', 'platforms': ['instagram']}
        resp = self.client.post(url, data, format='json')
        self.assertResponseStatus(resp, status.HTTP_201_CREATED)

    def test_post_schedule(self):
        url = reverse('socialpost-schedule')
        data = {
            'content': 'Scheduled post',
            'platforms': ['twitter'],
            'scheduled_at': '2026-07-01T10:00:00Z'
        }
        resp = self.client.post(url, data, format='json')
        self.assertResponseStatus(resp, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['status'], 'scheduled')

    def test_post_generate_ai(self):
        url = reverse('socialpost-generate-ai')
        data = {'prompt': 'Hello world', 'tone': 'casual'}
        resp = self.client.post(url, data, format='json')
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertTrue(resp.data['generated'])

    def test_post_calendar(self):
        url = reverse('socialpost-calendar')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_post_analytics_summary(self):
        url = reverse('socialpost-analytics-summary')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertIn('total_impressions', resp.data)

    # Messages
    def test_message_list(self):
        url = reverse('socialmessage-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_message_unread_count(self):
        url = reverse('socialmessage-unread-count')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertIn('unread', resp.data)

    def test_message_reply(self):
        url = reverse('socialmessage-reply', args=[self.message.id])
        resp = self.client.post(url, {'reply': 'Thanks!'}, format='json')
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertEqual(resp.data['status'], 'replied')

    def test_message_mark_all_read(self):
        url = reverse('socialmessage-mark-all-read')
        resp = self.client.post(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    # Campaigns
    def test_campaign_list(self):
        url = reverse('campaign-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_campaign_activate(self):
        url = reverse('campaign-activate', args=[self.campaign.id])
        resp = self.client.post(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.status, 'active')

    def test_campaign_performance(self):
        url = reverse('campaign-performance', args=[self.campaign.id])
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertIn('impressions', resp.data)

    # Media
    def test_media_list(self):
        url = reverse('media-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    # Hashtags
    def test_hashtag_suggest(self):
        url = reverse('hashtag-suggest')
        resp = self.client.get(url, {'topic': 'tech'})
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertIn('suggestions', resp.data)

    # Queue
    def test_queue_list(self):
        url = reverse('postqueue-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    # Webhook
    def test_webhook_list(self):
        url = reverse('webhook-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_webhook_create(self):
        url = reverse('webhook-list')
        data = {
            'event_type': 'new_message',
            'target_url': 'https://example.com/hook'
        }
        resp = self.client.post(url, data, format='json')
        self.assertResponseStatus(resp, status.HTTP_201_CREATED)

    # Permissions
    def test_viewer_cannot_create_post(self):
        viewer = User.objects.create_user(
            username='viewer', email='viewer@social.com', password='viewerpass'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=viewer, role='viewer'
        )
        self.client.force_authenticate(user=viewer)
        url = reverse('socialpost-list')
        resp = self.client.post(url, {'content': 'Bad'}, format='json')
        self.assertResponseStatus(resp, status.HTTP_403_FORBIDDEN)
