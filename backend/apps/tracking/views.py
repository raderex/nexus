from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Avg, Sum, Count, F
from datetime import datetime, date, timedelta

from .models import TimeLog, ActivityLog, Screenshot, ProductivityMetric, TimeLogApproval, AppUsage
from .serializers import (TimeLogSerializer, ActivityLogSerializer, ScreenshotSerializer,
                           ProductivityMetricSerializer, TimeLogApprovalSerializer, AppUsageSerializer)
from apps.hrm.models import Employee
from apps.core.permissions import IsOrgEditorOrReadOnly, IsOrgAdmin, IsOrgMember


class TimeLogViewSet(viewsets.ModelViewSet):
    """Time logs - editors can manage their own, viewers read-only."""
    serializer_class = TimeLogSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee', 'project', 'task', 'is_billable', 'is_running', 'source']
    ordering_fields = ['started_at', 'duration_seconds']

    def get_queryset(self):
        return TimeLog.objects.filter(
            employee__organization__members__user=self.request.user,
            employee__organization__members__is_active=True
        ).select_related('employee__user', 'task', 'project').order_by('-created_at').distinct()

    @action(detail=False, methods=['post'])
    def start_timer(self, request):
        employee = Employee.objects.filter(user=request.user).first()
        if not employee:
            return Response({'error': 'No employee profile found'}, status=400)
        # Stop any running timers
        TimeLog.objects.filter(employee=employee, is_running=True).update(
            is_running=False, ended_at=timezone.now()
        )
        for log in TimeLog.objects.filter(employee=employee, is_running=False, ended_at__isnull=False, duration_seconds=0):
            if log.started_at:
                log.duration_seconds = int((log.ended_at - log.started_at).total_seconds())
                log.save()
        log = TimeLog.objects.create(
            employee=employee,
            task_id=request.data.get('task'),
            project_id=request.data.get('project'),
            description=request.data.get('description', ''),
            started_at=timezone.now(),
            is_running=True,
            is_billable=request.data.get('is_billable', True),
            source=request.data.get('source', 'timer'),
        )
        return Response(TimeLogSerializer(log).data, status=201)

    @action(detail=True, methods=['post'])
    def stop_timer(self, request, pk=None):
        log = self.get_object()
        if not log.is_running:
            return Response({'error': 'Timer is not running'}, status=400)
        log.is_running = False
        log.ended_at = timezone.now()
        log.duration_seconds = int((log.ended_at - log.started_at).total_seconds())
        log.save()
        return Response(TimeLogSerializer(log).data)

    @action(detail=False, methods=['get'])
    def running(self, request):
        employee = Employee.objects.filter(user=request.user).first()
        if not employee:
            return Response(None)
        log = TimeLog.objects.filter(employee=employee, is_running=True).first()
        return Response(TimeLogSerializer(log).data if log else None)

    @action(detail=False, methods=['get'])
    def my_summary(self, request):
        employee = Employee.objects.filter(user=request.user).first()
        if not employee:
            return Response({})
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        def total_hours(qs):
            return round((qs.aggregate(s=Sum('duration_seconds'))['s'] or 0) / 3600, 2)
        return Response({
            'today_hours': total_hours(TimeLog.objects.filter(employee=employee, started_at__date=today)),
            'week_hours': total_hours(TimeLog.objects.filter(employee=employee, started_at__date__gte=week_start)),
            'month_hours': total_hours(TimeLog.objects.filter(employee=employee, started_at__date__gte=month_start)),
            'is_running': TimeLog.objects.filter(employee=employee, is_running=True).exists(),
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsOrgAdmin])
    def team_report(self, request):
        """Team report - admin only."""
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        employees = Employee.objects.filter(organization=org, is_active=True).select_related('user')
        report = []
        for emp in employees:
            logs = TimeLog.objects.filter(employee=emp, started_at__date__gte=week_start)
            total_sec = logs.aggregate(s=Sum('duration_seconds'))['s'] or 0
            report.append({
                'employee_id': str(emp.id),
                'name': emp.user.get_full_name(),
                'hours_this_week': round(total_sec / 3600, 2),
                'tasks_worked': logs.values('task').distinct().count(),
                'is_running': logs.filter(is_running=True).exists(),
            })
        return Response(report)

    @action(detail=True, methods=['post'])
    def submit_for_approval(self, request, pk=None):
        log = self.get_object()
        approval, created = TimeLogApproval.objects.get_or_create(time_log=log)
        return Response(TimeLogApprovalSerializer(approval).data, status=201 if created else 200)


class TimeLogApprovalViewSet(viewsets.ModelViewSet):
    """Time log approvals - admins can approve/reject."""
    serializer_class = TimeLogApprovalSerializer
    permission_classes = [IsAuthenticated, IsOrgMember]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        return TimeLogApproval.objects.filter(
            time_log__employee__organization__members__user=self.request.user
        ).select_related('time_log__employee__user', 'reviewed_by').order_by('-created_at').distinct()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOrgAdmin])
    def approve(self, request, pk=None):
        """Only admins can approve time logs."""
        approval = self.get_object()
        approval.status = 'approved'
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.comment = request.data.get('comment', '')
        approval.save()
        return Response(TimeLogApprovalSerializer(approval).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOrgAdmin])
    def reject(self, request, pk=None):
        """Only admins can reject time logs."""
        approval = self.get_object()
        approval.status = 'rejected'
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.comment = request.data.get('comment', '')
        approval.save()
        return Response(TimeLogApprovalSerializer(approval).data)


class ActivityLogViewSet(viewsets.ModelViewSet):
    """Activity logs - read-only for members, admin writes."""
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated, IsOrgMember]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee', 'date']
    ordering_fields = ['date']

    def get_queryset(self):
        return ActivityLog.objects.filter(
            employee__organization__members__user=self.request.user
        ).order_by('-created_at').distinct()


class ScreenshotViewSet(viewsets.ModelViewSet):
    """Screenshots - read access for members, system-created."""
    serializer_class = ScreenshotSerializer
    permission_classes = [IsAuthenticated, IsOrgMember]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee']
    ordering_fields = ['captured_at']

    def get_queryset(self):
        return Screenshot.objects.filter(
            employee__organization__members__user=self.request.user
        ).order_by('-created_at').distinct()


class ProductivityMetricViewSet(viewsets.ModelViewSet):
    """Productivity metrics - read for members, admin manages."""
    serializer_class = ProductivityMetricSerializer
    permission_classes = [IsAuthenticated, IsOrgMember]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'date']

    def get_queryset(self):
        return ProductivityMetric.objects.filter(
            employee__organization__members__user=self.request.user
        ).order_by('-created_at').distinct()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsOrgAdmin])
    def team_summary(self, request):
        """Team productivity summary - admin only."""
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        today = date.today()
        metrics = ProductivityMetric.objects.filter(
            employee__organization=org, date=today
        ).aggregate(
            avg_overall=Avg('overall_score'),
            avg_efficiency=Avg('efficiency_score'),
            avg_focus=Avg('focus_score'),
            total_tasks=Sum('tasks_completed'),
            total_hours=Sum('hours_worked'),
        )
        return Response(metrics)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsOrgAdmin])
    def leaderboard(self, request):
        """Productivity leaderboard - admin only."""
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        today = date.today()
        month_start = today.replace(day=1)
        metrics = (ProductivityMetric.objects
                   .filter(employee__organization=org, date__gte=month_start)
                   .values('employee__user__first_name', 'employee__user__last_name', 'employee_id')
                   .annotate(avg_score=Avg('overall_score'), total_hours=Sum('hours_worked'))
                   .order_by('-avg_score')[:10])
        return Response(list(metrics))
