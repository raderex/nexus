# Tracking Module API Tests

from django.urls import reverse
from rest_framework.test import APITestCase
from django.test import TestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.core.models import Organization, OrganizationMember
from apps.hrm.models import Employee
from .models import TimeLog, ActivityLog, Screenshot, ProductivityMetric, TimeLogApproval, AppUsage
from apps.pm.models import Project, Task

User = get_user_model()


class TrackingModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='trackuser', email='track@test.com', password='testpass123'
        )
        self.org = Organization.objects.create(
            name='Track Test Org', slug='track-test-org'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.user, role='owner'
        )
        self.employee = Employee.objects.create(
            organization=self.org, user=self.user,
            employee_code='EMP001', job_title='Engineer', hire_date='2026-01-01'
        )
        self.project = Project.objects.create(
            organization=self.org, name='Test Project', manager=self.user
        )
        self.task = Task.objects.create(
            project=self.project, title='Test Task', status='todo',
            assignee=self.user, reporter=self.user
        )
        self.timelog = TimeLog.objects.create(
            employee=self.employee, task=self.task, project=self.project,
            started_at='2026-06-06T09:00:00Z', duration_seconds=3600
        )
        self.activity = ActivityLog.objects.create(
            employee=self.employee, date='2026-06-06', total_active_seconds=28800
        )
        self.screenshot = Screenshot.objects.create(
            employee=self.employee, time_log=self.timelog,
            captured_at='2026-06-06T10:00:00Z', image='screenshots/test.png'
        )
        self.metric = ProductivityMetric.objects.create(
            employee=self.employee, date='2026-06-06',
            overall_score=85.0, hours_worked=8.0
        )
        self.approval = TimeLogApproval.objects.create(time_log=self.timelog)
        self.appusage = AppUsage.objects.create(
            activity_log=self.activity, app_name='VS Code', duration_seconds=3600
        )

    def test_timelog_creation(self):
        self.assertEqual(self.timelog.duration_seconds, 3600)

    def test_activity_log_creation(self):
        self.assertEqual(self.activity.total_active_seconds, 28800)

    def test_screenshot_creation(self):
        self.assertEqual(self.screenshot.image, 'screenshots/test.png')

    def test_productivity_metric_creation(self):
        self.assertEqual(float(self.metric.overall_score), 85.0)

    def test_approval_creation(self):
        self.assertEqual(self.approval.status, 'pending')

    def test_appusage_creation(self):
        self.assertEqual(self.appusage.app_name, 'VS Code')


class TrackingAPIEndpointTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner', email='owner@track.com', password='ownerpass'
        )
        self.org = Organization.objects.create(
            name='Track Org', slug='track-org'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.owner, role='owner'
        )
        self.employee = Employee.objects.create(
            organization=self.org, user=self.owner,
            employee_code='EMP002', job_title='Engineer', hire_date='2026-01-01'
        )
        self.project = Project.objects.create(
            organization=self.org, name='Proj', manager=self.owner
        )
        self.task = Task.objects.create(
            project=self.project, title='Work', status='todo',
            assignee=self.owner, reporter=self.owner
        )
        self.timelog = TimeLog.objects.create(
            employee=self.employee, task=self.task, project=self.project,
            started_at='2026-06-06T09:00:00Z', duration_seconds=3600, is_running=False
        )
        self.client.force_authenticate(user=self.owner)

    def assertResponseStatus(self, response, expected, msg=None):
        if msg is None:
            msg = f"Expected {expected}, got {response.status_code}"
        self.assertEqual(response.status_code, expected, msg)

    # TimeLog
    def test_timelog_list(self):
        url = reverse('timelog-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_timelog_create(self):
        url = reverse('timelog-list')
        data = {
            'employee': self.employee.id,
            'task': self.task.id,
            'project': self.project.id,
            'started_at': '2026-06-07T09:00:00Z',
            'description': 'Manual entry',
        }
        resp = self.client.post(url, data, format='json')
        self.assertResponseStatus(resp, status.HTTP_201_CREATED)

    def test_timelog_start_timer(self):
        url = reverse('timelog-start-timer')
        data = {'task': self.task.id, 'project': self.project.id}
        resp = self.client.post(url, data, format='json')
        self.assertResponseStatus(resp, status.HTTP_201_CREATED)

    def test_timelog_stop_timer(self):
        running = TimeLog.objects.create(
            employee=self.employee, task=self.task,
            started_at='2026-06-06T10:00:00Z', is_running=True
        )
        url = reverse('timelog-stop-timer', args=[running.id])
        resp = self.client.post(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        running.refresh_from_db()
        self.assertFalse(running.is_running)

    def test_timelog_running(self):
        url = reverse('timelog-running')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_timelog_my_summary(self):
        url = reverse('timelog-my-summary')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertIn('today_hours', resp.data)

    def test_timelog_team_report(self):
        url = reverse('timelog-team-report')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_timelog_submit_for_approval(self):
        url = reverse('timelog-submit-for-approval', args=[self.timelog.id])
        resp = self.client.post(url)
        self.assertResponseStatus(resp, status.HTTP_201_CREATED)

    # Approvals
    def test_approval_list(self):
        TimeLogApproval.objects.create(time_log=self.timelog)
        url = reverse('timelog-approval-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_approval_approve(self):
        approval = TimeLogApproval.objects.create(time_log=self.timelog)
        url = reverse('timelog-approval-approve', args=[approval.id])
        resp = self.client.post(url, {'comment': 'Looks good'}, format='json')
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        approval.refresh_from_db()
        self.assertEqual(approval.status, 'approved')

    def test_approval_reject(self):
        approval = TimeLogApproval.objects.create(time_log=self.timelog)
        url = reverse('timelog-approval-reject', args=[approval.id])
        resp = self.client.post(url, {'comment': 'Needs revision'}, format='json')
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        approval.refresh_from_db()
        self.assertEqual(approval.status, 'rejected')

    # Activity
    def test_activity_list(self):
        url = reverse('activity-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    # Screenshots
    def test_screenshot_list(self):
        url = reverse('screenshot-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    # Productivity
    def test_productivity_list(self):
        url = reverse('productivity-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_productivity_team_summary(self):
        ProductivityMetric.objects.create(
            employee=self.employee, date='2026-06-06', overall_score=85.0
        )
        url = reverse('productivity-team-summary')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_productivity_leaderboard(self):
        ProductivityMetric.objects.create(
            employee=self.employee, date='2026-06-06', overall_score=85.0
        )
        url = reverse('productivity-leaderboard')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    # AppUsage
    def test_appusage_list(self):
        ActivityLog.objects.create(employee=self.employee, date='2026-06-06')
        url = reverse('appusage-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    # Permissions
    def test_viewer_cannot_create_timelog(self):
        viewer = User.objects.create_user(
            username='viewer', email='viewer@track.com', password='viewerpass'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=viewer, role='viewer'
        )
        self.client.force_authenticate(user=viewer)
        url = reverse('timelog-list')
        resp = self.client.post(url, {'description': 'Test'}, format='json')
        self.assertResponseStatus(resp, status.HTTP_403_FORBIDDEN)

    def test_viewer_cannot_approve(self):
        viewer = User.objects.create_user(
            username='viewer2', email='viewer2@track.com', password='viewerpass'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=viewer, role='viewer'
        )
        self.client.force_authenticate(user=viewer)
        approval = TimeLogApproval.objects.create(time_log=self.timelog)
        url = reverse('timelog-approval-approve', args=[approval.id])
        resp = self.client.post(url)
        self.assertResponseStatus(resp, status.HTTP_403_FORBIDDEN)
