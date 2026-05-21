# Nexus — All-in-One Business Platform

ERP · CRM · HRM · ATS · Project Management · Time Tracking · Social Media CMS

## About

Nexus is a comprehensive business management suite that bundles seven major modules under one roof. It spans a **Django + DRF** backend, a **React** frontend, and a **Flutter** mobile app, all orchestrated via Docker with PostgreSQL, Redis/Celery, and Nginx.

| Module | Purpose |
|--------|---------|
| **ERP** | Invoices, expenses, income, accounts, transactions |
| **CRM** | Contacts, deals, pipeline, activities, unified inbox |
| **HRM** | Employees, departments, attendance, payroll, leave, reviews |
| **ATS** | Job postings, applicant tracking (Kanban), interviews, offers |
| **PM** | Projects, sprints, Kanban boards, tasks, milestones |
| **Time Tracking** | Live timer, approvals, activity logs, screenshots, productivity |
| **Social/CMS** | Post composer, AI generation, multi-platform scheduling, analytics |

## Stack
- **Backend**: Django 5 + Django REST Framework + JWT + Celery + Redis
- **Frontend**: React 18 + Tailwind CSS + Zustand + React Router
- **Mobile**: Flutter (iOS + Android)
- **Database**: PostgreSQL (SQLite for dev)
- **Queue**: Redis + Celery

## Quick Start (Development)

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python seed_data.py          # creates demo data
python manage.py runserver   # http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start                    # http://localhost:3000
```

### Login
- URL: http://localhost:3000
- Username: `admin`
- Password: `nexus123`

### API Docs
- Swagger: http://localhost:8000/api/docs/
- Admin: http://localhost:8000/admin/

## Production (Docker)
```bash
cp .env.example .env        # edit values
docker compose up -d
```

## Mobile
```bash
cd mobile
flutter pub get
flutter run                  # connect device or emulator
```

## Modules
| Module | Features |
|--------|---------|
| **ERP** | Invoices, Expenses, Income, Accounts, Transactions |
| **CRM** | Contacts, Deals, Pipeline, Activities, Unified Inbox |
| **HRM** | Employees, Departments, Attendance, Payroll, Leave, Performance Reviews, Goals, Assets |
| **ATS** | Job Postings, Applicant Pipeline (Kanban), Interviews, Scorecards, Offer Letters |
| **PM** | Projects, Sprints, Kanban Board, Tasks, Subtasks, Comments, Milestones, Time Log |
| **Tracking** | Live Timer, Time Approvals, Activity Logs, Screenshots, Productivity Metrics, Leaderboard |
| **Social/CMS** | Post Composer, AI Generation, Multi-platform Scheduling, Inbox, Campaigns, Analytics, Hashtags, Media |

## Environment Variables
```env
SECRET_KEY=your-secret-key
DEBUG=False
DB_ENGINE=postgresql
DB_NAME=nexus_db
DB_USER=nexus_user
DB_PASSWORD=your-db-pass
DB_HOST=localhost
REDIS_URL=redis://localhost:6379/0
ANTHROPIC_API_KEY=sk-ant-...   # for AI post generation
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
TWITTER_API_KEY=
TWITTER_API_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```
