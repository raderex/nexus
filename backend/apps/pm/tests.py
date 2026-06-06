# PM Module API Tests

from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.core.models import Organization, OrganizationMember
from .models import (
    Project, Milestone, Task, TaskComment,
    Sprint, TaskAttachment
)

User = get_user_model()

# -------------------------------------------------
# Model sanity checks
# -------------------------------------------------
class PMModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='pmuser', email='pm@test.com', password='testpass123'
        )
        self.org = Organization.objects.create(
            name='PM Test Org', slug='pm-test-org', email='pm@test.com'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.user, role='owner'
        )
        # Project
        self.project = Project.objects.create(
            organization=self.org,
            name='Website Redesign',
            manager=self.user,
            status='active',
            priority='high'
        )
        # Milestone
        self.milestone = Milestone.objects.create(
            project=self.project,
            name='Design Complete',
            due_date='2026-07-01'
        )
        # Sprint
        self.sprint = Sprint.objects.create(
            project=self.project,
            name='Sprint 1',
            start_date='2026-06-10',
            end_date='2026-06-24',
            status='active'
        )
        # Task
        self.task = Task.objects.create(
            project=self.project,
            milestone=self.milestone,
            title='Create wireframes',
            status='todo',
            assignee=self.user,
            reporter=self.user
        )
        # Comment
        self.comment = TaskComment.objects.create(
            task=self.task,
            author=self.user,
            content='Initial comment'
        )
        # Attachment (dummy metadata, no file needed)
        self.attachment = TaskAttachment.objects.create(
            task=self.task,
            uploaded_by=self.user,
            filename='specs.pdf',
            size_bytes=1024,
            content_type='application/pdf'
        )

    def test_project_creation(self):
        self.assertEqual(self.project.name, 'Website Redesign')
        self.assertEqual(self.project.status, 'active')

    def test_milestone_creation(self):
        self.assertEqual(self.milestone.name, 'Design Complete')

    def test_sprint_creation(self):
        self.assertEqual(self.sprint.name, 'Sprint 1')
        self.assertEqual(self.sprint.status, 'active')

    def test_task_creation(self):
        self.assertEqual(self.task.title, 'Create wireframes')
        self.assertEqual(self.task.status, 'todo')

    def test_comment_creation(self):
        self.assertEqual(self.comment.content, 'Initial comment')

    def test_attachment_creation(self):
        self.assertEqual(self.attachment.filename, 'specs.pdf')

# -------------------------------------------------
# API endpoint tests
# -------------------------------------------------
class PMAPIEndpointTests(APITestCase):
    def setUp(self):
        # Owner user (full permissions)
        self.owner = User.objects.create_user(
            username='owner', email='owner@pm.com', password='ownerpass'
        )
        self.org = Organization.objects.create(
            name='PM Org', slug='pm-org', email='pm@test.com'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=self.owner, role='owner'
        )
        # Basic objects for reference in API calls
        self.project = Project.objects.create(
            organization=self.org,
            name='Mobile App',
            manager=self.owner,
            status='planning',
            priority='medium'
        )
        self.milestone = Milestone.objects.create(
            project=self.project,
            name='MVP',
            due_date='2026-08-01'
        )
        self.sprint = Sprint.objects.create(
            project=self.project,
            name='Sprint Alpha',
            start_date='2026-06-01',
            end_date='2026-06-14',
            status='planned'
        )
        self.task = Task.objects.create(
            project=self.project,
            milestone=self.milestone,
            title='Setup CI/CD',
            status='todo',
            assignee=self.owner,
            reporter=self.owner
        )
        self.client.force_authenticate(user=self.owner)

    def assertResponseStatus(self, response, expected, msg=None):
        if msg is None:
            msg = f"Expected {expected}, got {response.status_code}"
        self.assertEqual(response.status_code, expected, msg)

    # ----- Projects -----
    def test_project_list(self):
        url = reverse('project-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_project_create(self):
        url = reverse('project-list')
        data = {
            "name": "New Project",
            "status": "planning",
            "priority": "low",
            "manager": self.owner.id
        }
        resp = self.client.post(url, data, format='json')
        self.assertResponseStatus(resp, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['name'], "New Project")

    def test_project_update(self):
        url = reverse('project-detail', args=[self.project.id])
        resp = self.client.patch(url, {"status": "active"}, format='json')
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, 'active')

    # ----- Milestones -----
    def test_milestone_list(self):
        url = reverse('milestone-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_milestone_create(self):
        url = reverse('milestone-list')
        data = {
            "project": self.project.id,
            "name": "Release",
            "due_date": "2026-09-01"
        }
        resp = self.client.post(url, data, format='json')
        self.assertResponseStatus(resp, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['name'], "Release")

    # ----- Tasks -----
    def test_task_list(self):
        url = reverse('task-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_task_create(self):
        url = reverse('task-list')
        data = {
            "project": self.project.id,
            "title": "Write docs",
            "status": "todo",
            "assignee": self.owner.id,
            "reporter": self.owner.id
        }
        resp = self.client.post(url, data, format='json')
        self.assertResponseStatus(resp, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['title'], "Write docs")

    def test_task_update_status(self):
        url = reverse('task-detail', args=[self.task.id])
        resp = self.client.patch(url, {"status": "in_progress"}, format='json')
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, 'in_progress')

    # ----- Task Comments -----
    def test_taskcomment_create(self):
        url = reverse('taskcomment-list')
        data = {
            "task": self.task.id,
            "author": self.owner.id,
            "content": "Need review"
        }
        resp = self.client.post(url, data, format='json')
        self.assertResponseStatus(resp, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['content'], "Need review")

    # ----- Sprints -----
    def test_sprint_list(self):
        url = reverse('sprint-list')
        resp = self.client.get(url)
        self.assertResponseStatus(resp, status.HTTP_200_OK)

    def test_sprint_start(self):
        url = reverse('sprint-detail', args=[self.sprint.id])
        resp = self.client.patch(url, {"status": "active"}, format='json')
        self.assertResponseStatus(resp, status.HTTP_200_OK)
        self.sprint.refresh_from_db()
        self.assertEqual(self.sprint.status, 'active')

    # ----- Attachments -----
    def test_taskattachment_create(self):
        url = reverse('taskattachment-list')
        data = {
            "task": self.task.id,
            "uploaded_by": self.owner.id,
            "filename": "design.png",
            "size_bytes": 2048,
            "content_type": "image/png"
        }
        resp = self.client.post(url, data, format='json')
        self.assertResponseStatus(resp, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['filename'], "design.png")

    # ----- Permission checks -----
    def test_viewer_cannot_create_project(self):
        viewer = User.objects.create_user(
            username='viewer', email='viewer@pm.com', password='viewerpass'
        )
        OrganizationMember.objects.create(
            organization=self.org, user=viewer, role='viewer'
        )
        self.client.force_authenticate(user=viewer)
        url = reverse('project-list')
        resp = self.client.post(url, {"name": "Bad", "manager": viewer.id}, format='json')
        self.assertResponseStatus(resp, status.HTTP_403_FORBIDDEN)

# End of PM tests
