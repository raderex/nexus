# Backend Tasks — Agent Instructions

## Overview
Build missing CRUD operations, fix bugs, add tests, and production-harden the Django REST API. All modules (erp, crm, hrm, ats, pm, tracking, social) need complete working endpoints.

---

## Priority 1 — Missing CRUD & Actions

### [ERP] — Complete + Test
Create test data for invoices, expenses, incomes via the API / admin. Verify:
- `POST /api/erp/invoices/` + `PATCH`, `DELETE`
- `POST /api/erp/expenses/` + approve/reject actions
- `POST /api/erp/incomes/`
- `POST /api/erp/accounts/`
- All custom actions: `mark_paid`, `summary`, `approve`, `reject`

### [CRM] — Verify & Complete
- Verify `GET /api/crm/pipelines/`, `contacts/`, `deals/`, `activities/`
- Add `POST` create for all (if any missing)
- Test `pipeline_summary` and activity `complete`

### [HRM] — Verify & Complete
- Verify all 9 viewset endpoints work
- Test attendance `today_summary`, `bulk_mark`
- Test payroll `summary`
- Test leave request approve/reject
- Test asset assign/unassign

### [ATS] — Verify & Complete
- Verify jobs CRUD + publish/close
- Verify applicants CRUD + move_stage/rate
- Verify interviews CRUD + complete/cancel
- Verify offers CRUD + send/accept/reject
- Test `pipeline_stats`

### [PM] — Verify & Complete
- Verify projects CRUD + task_board/stats/add_member
- Verify sprints CRUD + start/complete/burndown
- Verify tasks CRUD + update_status/add_comment/subtasks/log_time
- Verify milestones CRUD

### [Tracking] — Verify & Complete
- Verify time-logs CRUD + start_timer/stop_timer/running/my_summary
- Test team_report (admin only)
- Test approvals approve/reject
- Test productivity team_summary/leaderboard (admin only)

### [Social] — Verify & Complete
- Verify accounts CRUD + overview/sync
- Verify posts CRUD + schedule/generate_ai/calendar/analytics_summary
- Verify messages + unread_count/reply/mark_all_read
- Verify campaigns CRUD + activate/performance
- Verify media upload, hashtags suggest, queue

---

## Priority 2 — Fix All Bugs

### Known issues:
1. **PM tasks filter** ✅ Fixed — removed `'sprint'` from `filterset_fields`
2. **UnorderedObjectListWarning** ✅ Fixed — added `order_by('-created_at')` to all 40 viewsets
3. **Any remaining 500 errors** — visit every endpoint; fix all tracebacks

### Check for:
- Missing `.env` variables causing crashes
- Image/file upload failures (screenshots, resumes, avatars)
- Celery task failures
- Any `DoesNotExist` or `PermissionDenied` not caught

---

## Priority 3 — Tests
Only `apps/core/tests.py` exists (182 lines). Write tests for:

### Each module needs:
- Model creation tests
- API endpoint tests (GET list, GET detail, POST create, PATCH update, DELETE)
- Permission tests (viewer gets 403 on POST, admin gets 200)
- Custom action tests (approve, reject, move_stage, etc.)

**Run:** `python manage.py test apps.erp apps.crm apps.hrm apps.ats apps.pm apps.tracking apps.social`

---

## Priority 4 — Production Readiness

### Security
- Audit `permission_classes` on every viewset
- Rate limit auth endpoints: `POST /api/auth/token/`, `/api/auth/register/`
- Validate file uploads (type, size, content)
- No secrets in debug output

### Config
- `docker-compose.yml` — web (gunicorn), db (postgres), redis, celery worker, celery beat
- `entrypoint.sh` — migrate, collectstatic, create superuser, start gunicorn
- Set `DEBUG=False`, test without stack traces
- Configure `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` for production

### Tasks & Scheduling
- Add Celery beat task for scheduled social post publishing
- Add Celery beat task for email reminders (leave approvals, invoice overdue)
- Add health check endpoint: `GET /api/health/`

### Monitoring
- Add structured logging (JSON format for production)
- Add Sentry or error tracking integration

---

## How to Code

Each module follows this pattern:
```
router = DefaultRouter()
router.register(r'modelname', ModelViewSet, basename='modelname')
```

Each ViewSet needs:
```python
class SomeViewSet(viewsets.ModelViewSet):
    serializer_class = SomeSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['field1', 'field2']
    search_fields = ['name', 'description']
    
    def get_queryset(self):
        return SomeModel.objects.filter(
            organization__members__user=self.request.user
        ).order_by('-created_at').distinct()
```

For custom actions:
```python
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        obj = self.get_object()
        obj.status = 'approved'
        obj.save()
        return Response(SomeSerializer(obj).data)
```

---

## File Structure
```
backend/
├── apps/
│   ├── erp/   → urls.py, views.py, serializers.py, models.py
│   ├── crm/   → same pattern
│   ├── hrm/   → same pattern
│   ├── ats/   → same pattern
│   ├── pm/    → same pattern
│   ├── tracking/ → same pattern
│   └── social/ → same pattern
├── nexus/
│   ├── settings.py
│   └── urls.py (root URLconf)
└── requirements.txt
```

All modules are already registered in `INSTALLED_APPS` and root `urls.py`. Focus on fixing bugs, writing tests, and production hardening.
