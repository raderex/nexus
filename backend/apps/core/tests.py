from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import (
    Organization, OrganizationMember,
    Contact, Deal, Pipeline,
    Employee, Department,
    Project, Task,
    SocialPost, SocialAccount
)

User = get_user_model()

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

class CRMTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='crmuser',
            email='crm@test.com',
            password='testpass123'
        )
        self.org = Organization.objects.create(
            name='CRM Test',
            slug='crm-test',
            email='crm@test.com'
        )
        self.pipeline = Pipeline.objects.create(
            organization=self.org,
            name='Sales Pipeline',
            stages=[
                {'id': 'new', 'name': 'New', 'color': '#6366f1'},
                {'id': 'qualified', 'name': 'Qualified', 'color': '#06b6d4'},
                {'id': 'proposal', 'name': 'Proposal', 'color': '#f59e0b'},
                {'id': 'won', 'name': 'Closed Won', 'color': '#10b981'},
            ],
            is_default=True
        )
        self.contact = Contact.objects.create(
            organization=self.org,
            first_name='John',
            last_name='Doe',
            email='john@example.com',
            type='lead',
            assigned_to=self.user
        )

    def test_pipeline_stages(self):
        self.assertEqual(len(self.pipeline.stages), 4)
        self.assertEqual(self.pipeline.stages[0]['name'], 'New')

    def test_contact_creation(self):
        self.assertEqual(self.contact.first_name, 'John')
        self.assertEqual(self.contact.type, 'lead')
        self.assertEqual(self.contact.assigned_to, self.user)

class HRMTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='hruser',
            email='hr@test.com',
            password='testpass123'
        )
        self.org = Organization.objects.create(
            name='HR Test',
            slug='hr-test',
            email='hr@test.com'
        )
        self.dept = Department.objects.create(
            organization=self.org,
            name='Engineering',
            color='#6366f1'
        )
        self.employee = Employee.objects.create(
            organization=self.org,
            user=self.user,
            employee_code='EMP001',
            job_title='Developer',
            employment_type='full_time',
            salary=5000,
            hire_date='2024-01-01'
        )

    def test_employee_code(self):
        self.assertEqual(self.employee.employee_code, 'EMP001')

    def test_department_association(self):
        self.assertIsNone(self.employee.department)  # Not assigned yet

class PMTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='pmuser',
            email='pm@test.com',
            password='testpass123'
        )
        self.org = Organization.objects.create(
            name='PM Test',
            slug='pm-test',
            email='pm@test.com'
        )
        self.project = Project.objects.create(
            organization=self.org,
            name='Test Project',
            status='active',
            priority='high',
            manager=self.user
        )
        self.task = Task.objects.create(
            project=self.project,
            title='Test Task',
            status='todo',
            priority='high',
            assignee=self.user,
            reporter=self.user
        )

    def test_project_creation(self):
        self.assertEqual(self.project.name, 'Test Project')
        self.assertEqual(self.project.status, 'active')

    def test_task_assignment(self):
        self.assertEqual(self.task.assignee, self.user)
        self.assertEqual(self.task.status, 'todo')

class SocialTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='socialuser',
            email='social@test.com',
            password='testpass123'
        )
        self.org = Organization.objects.create(
            name='Social Test',
            slug='social-test',
            email='social@test.com'
        )
        self.account = SocialAccount.objects.create(
            organization=self.org,
            platform='twitter',
            account_name='Test Account',
            account_handle='@test',
            is_connected=True
        )
        self.post = SocialPost.objects.create(
            organization=self.org,
            author=self.user,
            content='Test post content',
            platforms=['twitter', 'facebook'],
            status='draft'
        )

    def test_social_account(self):
        self.assertEqual(self.account.platform, 'twitter')
        self.assertTrue(self.account.is_connected)

    def test_post_platforms(self):
        self.assertEqual(len(self.post.platforms), 2)
        self.assertIn('twitter', self.post.platforms)
