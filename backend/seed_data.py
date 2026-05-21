"""
Nexus seed data — run: python3 manage.py shell < seed_data.py
Creates demo org, users, and sample data for all modules.
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nexus.settings')
django.setup()

from django.utils.text import slugify
from datetime import date, timedelta, datetime
from apps.core.models import User, Organization, OrganizationMember
from apps.hrm.models import Department, Employee
from apps.crm.models import Pipeline, Contact, Deal
from apps.pm.models import Project, Task
from apps.social.models import SocialAccount, SocialPost
from apps.ats.models import JobPosting

print("🌱 Seeding Nexus demo data...")

# Organization
org, _ = Organization.objects.get_or_create(
    slug='nexus-demo',
    defaults={
        'name': 'Nexus Demo Inc.',
        'email': 'hello@nexus.demo',
        'currency': 'USD',
        'timezone': 'UTC',
    }
)

# Super admin
admin_user, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@nexus.demo',
        'first_name': 'John',
        'last_name': 'Doe',
        'role': 'super_admin',
        'is_staff': True,
        'is_superuser': True,
    }
)
if created:
    admin_user.set_password('nexus123')
    admin_user.save()

OrganizationMember.objects.get_or_create(organization=org, user=admin_user, defaults={'role': 'owner'})

# More users
users_data = [
    ('sarah', 'sarah@nexus.demo', 'Sarah', 'Mitchell', 'manager'),
    ('mike', 'mike@nexus.demo', 'Mike', 'Kim', 'employee'),
    ('emily', 'emily@nexus.demo', 'Emily', 'Parker', 'employee'),
]
users = [admin_user]
for username, email, fname, lname, role in users_data:
    u, created = User.objects.get_or_create(username=username, defaults={
        'email': email, 'first_name': fname, 'last_name': lname, 'role': role
    })
    if created:
        u.set_password('nexus123')
        u.save()
    OrganizationMember.objects.get_or_create(organization=org, user=u, defaults={'role': 'editor'})
    users.append(u)

# Departments
depts_data = [('Engineering', '#6366f1'), ('Marketing', '#ec4899'), ('Sales', '#f59e0b'), ('HR', '#10b981')]
depts = []
for name, color in depts_data:
    d, _ = Department.objects.get_or_create(organization=org, name=name, defaults={'color': color, 'manager': admin_user})
    depts.append(d)

# Employees
emp_data = [
    (admin_user, 'EMP-001', 'CEO', depts[0], 15000),
    (users[1], 'EMP-002', 'Marketing Manager', depts[1], 8000),
    (users[2], 'EMP-003', 'Developer', depts[0], 7000),
    (users[3], 'EMP-004', 'Designer', depts[1], 6500),
]
for user, code, title, dept, salary in emp_data:
    Employee.objects.get_or_create(user=user, defaults={
        'organization': org, 'employee_code': code, 'job_title': title,
        'department': dept, 'salary': salary, 'currency': 'USD',
        'hire_date': date(2024, 1, 1),
    })

# CRM Pipeline
pipeline, _ = Pipeline.objects.get_or_create(organization=org, name='Sales Pipeline', defaults={
    'is_default': True,
    'stages': [
        {'id': 'new', 'name': 'New Lead', 'color': '#6366f1'},
        {'id': 'qualified', 'name': 'Qualified', 'color': '#06b6d4'},
        {'id': 'proposal', 'name': 'Proposal', 'color': '#f59e0b'},
        {'id': 'negotiation', 'name': 'Negotiation', 'color': '#ec4899'},
        {'id': 'won', 'name': 'Closed Won', 'color': '#10b981'},
        {'id': 'lost', 'name': 'Closed Lost', 'color': '#ef4444'},
    ]
})

# Contacts
contacts_data = [
    ('Sarah', 'Mitchell', 'sarah.m@techcorp.com', 'TechCorp Inc.', 'customer'),
    ('James', 'Davidson', 'james@startup.io', 'StartupIO', 'lead'),
    ('Emily', 'Parker', 'emily@design.co', 'Design Studio', 'prospect'),
    ('Michael', 'Kim', 'mike@enterprise.com', 'Enterprise Solutions', 'customer'),
]
contacts = []
for fname, lname, email, company, ctype in contacts_data:
    c, _ = Contact.objects.get_or_create(
        organization=org, email=email,
        defaults={'first_name': fname, 'last_name': lname, 'company': company, 'type': ctype, 'assigned_to': users[1]}
    )
    contacts.append(c)

# Deals
deals_data = [
    ('Website Redesign', 12000, 'qualified', contacts[0], 60),
    ('Enterprise License', 45000, 'proposal', contacts[3], 75),
    ('Startup Package', 8500, 'new', contacts[1], 25),
    ('Design Sprint', 6000, 'won', contacts[2], 100),
]
for title, value, stage, contact, prob in deals_data:
    Deal.objects.get_or_create(
        organization=org, title=title,
        defaults={'pipeline': pipeline, 'contact': contact, 'value': value, 'stage': stage, 'probability': prob, 'status': 'won' if prob == 100 else 'open', 'assigned_to': users[1]}
    )

# Projects
projects_data = [
    ('Q3 Marketing Campaign', 'active', 65, '#ec4899'),
    ('Website Redesign', 'active', 40, '#ef4444'),
    ('Mobile App v2.0', 'planning', 15, '#f59e0b'),
]
projs = []
for name, status, progress, color in projects_data:
    p, _ = Project.objects.get_or_create(
        organization=org, name=name,
        defaults={'status': status, 'progress': progress, 'color': color, 'manager': admin_user,
                  'start_date': date.today(), 'end_date': date.today() + timedelta(days=90)}
    )
    projs.append(p)

# Tasks
tasks_data = [
    ('Design new landing page', 'in_progress', 'high', projs[0]),
    ('Implement OAuth2 login', 'in_progress', 'urgent', projs[1]),
    ('Research competitor features', 'todo', 'medium', projs[0]),
    ('Set up CI/CD pipeline', 'todo', 'medium', projs[1]),
    ('Database schema design', 'done', 'high', projs[1]),
]
for title, status, priority, project in tasks_data:
    Task.objects.get_or_create(
        project=project, title=title,
        defaults={'status': status, 'priority': priority, 'assignee': users[2], 'reporter': admin_user}
    )

# Social accounts
social_data = [
    ('facebook', 'Nexus Official', '@nexusofficial', 45200),
    ('twitter', 'Nexus HQ', '@nexusHQ', 32100),
    ('instagram', 'Nexus App', '@nexus.app', 67800),
    ('linkedin', 'Nexus Inc.', 'nexus-inc', 12400),
]
for platform, name, handle, followers in social_data:
    SocialAccount.objects.get_or_create(
        organization=org, platform=platform,
        defaults={'account_name': name, 'account_handle': handle, 'follower_count': followers, 'is_connected': True}
    )

# Social posts
posts_content = [
    ("Excited to announce our new product launch! 🚀 After months of hard work, we're ready to share Nexus with the world.", ['facebook', 'twitter', 'linkedin'], 'published'),
    ("Behind the scenes at Nexus HQ 📸 Our team working hard on the next big feature.", ['instagram', 'twitter'], 'published'),
    ("New tutorial: Learn how to maximize your social media ROI using data-driven strategies.", ['youtube', 'facebook'], 'scheduled'),
]
for content, platforms, status in posts_content:
    SocialPost.objects.get_or_create(
        organization=org, content=content[:50],
        defaults={'content': content, 'platforms': platforms, 'status': status, 'author': admin_user,
                  'scheduled_at': datetime.now() + timedelta(hours=3) if status == 'scheduled' else None}
    )

# Job postings
jobs_data = [
    ('Senior React Developer', 'Engineering', 'published'),
    ('Social Media Manager', 'Marketing', 'published'),
    ('UX/UI Designer', 'Design', 'draft'),
]
for title, dept_name, status in jobs_data:
    dept = next((d for d in depts if d.name.lower() in dept_name.lower()), depts[0])
    JobPosting.objects.get_or_create(
        organization=org, title=title,
        defaults={'department': dept, 'status': status, 'description': f'We are looking for a {title}.',
                  'location': 'Remote', 'employment_type': 'full_time', 'created_by': admin_user}
    )

print("""
✅ Seed complete!

Login credentials:
  URL:      http://localhost:8000/api/auth/token/
  Username: admin
  Password: nexus123

API Docs: http://localhost:8000/api/docs/
""")
