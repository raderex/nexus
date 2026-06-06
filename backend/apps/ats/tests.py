# ATS Module API Tests

from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.core.models import Organization, OrganizationMember

from .models import (
    JobPosting, Applicant, Interview,
    OfferLetter, InterviewScorecard
)

User = get_user_model()

# --------------------------------------------------
# Model sanity tests
# --------------------------------------------------

class ATSModelTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='atsowner', email='ats@test.com', password='testpass123'
        )
        self.org = Organization.objects.create(
            name='ATS Org', slug='ats-org'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.owner, role='owner'
        )
        self.job = JobPosting.objects.create(
            organization=self.org,
            title='Backend Developer',
            description='Python/Django',
            employment_type='full_time',
            status='draft',
            created_by=self.owner
        )
        self.applicant = Applicant.objects.create(
            job=self.job,
            first_name='Alice',
            last_name='Smith',
            email='alice@example.com',
            stage='new'
        )
        self.interview = Interview.objects.create(
            applicant=self.applicant,
            interviewer=self.owner,
            scheduled_at='2026-06-20T14:00:00Z',
            interview_type='video'
        )
        self.offer = OfferLetter.objects.create(
            applicant=self.applicant,
            job=self.job,
            salary=85000.0,
            currency='USD',
            status='draft',
            created_by=self.owner
        )
        self.scorecard = InterviewScorecard.objects.create(
            interview=self.interview,
            technical_skills=4,
            communication=4,
            problem_solving=5,
            culture_fit=4,
            overall=4
        )

    def test_job_creation(self):
        self.assertEqual(self.job.title, 'Backend Developer')

    def test_applicant_creation(self):
        self.assertEqual(self.applicant.stage, 'new')

    def test_interview_creation(self):
        self.assertEqual(self.interview.interview_type, 'video')

    def test_offer_creation(self):
        self.assertEqual(self.offer.status, 'draft')

    def test_scorecard_creation(self):
        self.assertEqual(self.scorecard.overall, 4)


# --------------------------------------------------
# API endpoint tests
# --------------------------------------------------

class ATSAPIEndpointTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner', email='owner@ats.com', password='ownerpass'
        )
        self.org = Organization.objects.create(
            name='ATS Org', slug='ats-org'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.owner, role='owner'
        )
        self.job = JobPosting.objects.create(
            organization=self.org,
            title='Frontend Engineer',
            description='React/JS',
            employment_type='full_time',
            status='draft',
            created_by=self.owner
        )
        self.applicant = Applicant.objects.create(
            job=self.job,
            first_name='Bob',
            last_name='Jones',
            email='bob@example.com',
            stage='new'
        )
        self.interview = Interview.objects.create(
            applicant=self.applicant,
            interviewer=self.owner,
            scheduled_at='2026-06-20T15:00:00Z',
            interview_type='video'
        )
        self.client.force_authenticate(user=self.owner)

    # Helper
    def assertResponseStatus(self, response, expected, msg=None):
        if msg is None:
            msg = f"Expected status code {expected}, got {response.status_code}"
        self.assertEqual(response.status_code, expected, msg)

    # JobPosting
    def test_jobposting_list(self):
        url = reverse('job-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_jobposting_create(self):
        url = reverse('job-list')
        resp = self.client.post(url, {
            'title': 'DevOps',
            'description': 'Kubernetes',
            'employment_type': 'contract',
            'status': 'draft'
        }, format='json')
        self.assertResponseStatus(resp, status.HTTP_201_CREATED)

    def test_jobposting_publish(self):
        url = reverse('job-publish', args=[self.job.id])
        resp = self.client.post(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, 'published')

    def test_jobposting_close(self):
        url_publish = reverse('job-publish', args=[self.job.id])
        self.client.post(url_publish)
        url_close = reverse('job-close', args=[self.job.id])
        resp = self.client.post(url_close)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, 'closed')

    def test_pipeline_stats(self):
        url = reverse('job-pipeline-stats')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertIn('by_stage', resp.data)

    # Applicant
    def test_applicant_list(self):
        url = reverse('applicant-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_applicant_move_stage(self):
        url = reverse('applicant-move-stage', args=[self.applicant.id])
        resp = self.client.post(url, {'stage': 'interview'}, format='json')
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.applicant.refresh_from_db()
        self.assertEqual(self.applicant.stage, 'interview')

    def test_applicant_rate(self):
        url = reverse('applicant-rate', args=[self.applicant.id])
        resp = self.client.post(url, {'rating': 4, 'notes': 'Excellent'}, format='json')
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.applicant.refresh_from_db()
        self.assertEqual(self.applicant.rating, 4)

    # Interview
    def test_interview_complete(self):
        url = reverse('interview-complete', args=[self.interview.id])
        resp = self.client.post(url, {'feedback': 'Great', 'score': 5}, format='json')
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.interview.refresh_from_db()
        self.assertEqual(self.interview.status, 'completed')

    def test_interview_cancel(self):
        url = reverse('interview-cancel', args=[self.interview.id])
        resp = self.client.post(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.interview.refresh_from_db()
        self.assertEqual(self.interview.status, 'cancelled')

    # OfferLetter (admin-only "send")
    def test_offerletter_send(self):
        admin = User.objects.create_user(username='admin', email='admin@test.com', password='adminpass')
        OrganizationMember.objects.create(organization=self.org, user=admin, role='admin')
        self.client.force_authenticate(user=admin)
        offer = OfferLetter.objects.create(
            applicant=self.applicant,
            job=self.job,
            salary=90000,
            currency='USD',
            status='draft',
            created_by=admin
        )
        url = reverse('offer-send', args=[offer.id])
        resp = self.client.post(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        offer.refresh_from_db()
        self.assertEqual(offer.status, 'sent')

    def test_offerletter_accept(self):
        offer = OfferLetter.objects.create(
            applicant=self.applicant,
            job=self.job,
            salary=90000,
            currency='USD',
            status='draft',
            created_by=self.owner
        )
        url = reverse('offer-accept', args=[offer.id])
        resp = self.client.post(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        offer.refresh_from_db()
        self.assertEqual(offer.status, 'accepted')

    def test_offerletter_reject(self):
        offer = OfferLetter.objects.create(
            applicant=self.applicant,
            job=self.job,
            salary=90000,
            currency='USD',
            status='sent',
            created_by=self.owner
        )
        url = reverse('offer-reject', args=[offer.id])
        resp = self.client.post(url, {'reason': 'Too late'}, format='json')
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        offer.refresh_from_db()
        self.assertEqual(offer.status, 'rejected')

    # Permissions
    def test_viewer_cannot_create_job(self):
        viewer = User.objects.create_user(username='viewer', email='viewer@test.com', password='viewerpass')
        OrganizationMember.objects.create(organization=self.org, user=viewer, role='viewer')
        self.client.force_authenticate(user=viewer)
        url = reverse('job-list')
        resp = self.client.post(url, {'title': 'Bad'}, format='json')
        self.assertResponseStatus(resp, status.HTTP_403_FORBIDDEN)