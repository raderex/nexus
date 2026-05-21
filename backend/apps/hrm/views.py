from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q
from datetime import date, timedelta

from .models import (Department, Employee, Payroll, Attendance,
                     LeaveType, LeaveBalance, LeaveRequest,
                     PerformanceGoal, PerformanceReview, Asset)
from .serializers import (DepartmentSerializer, EmployeeSerializer,
                           PayrollSerializer, AttendanceSerializer,
                           LeaveTypeSerializer, LeaveBalanceSerializer, LeaveRequestSerializer,
                           PerformanceGoalSerializer, PerformanceReviewSerializer, AssetSerializer)


class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        return Department.objects.filter(
            organization__members__user=self.request.user,
            organization__members__is_active=True
        ).distinct()

    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org)


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'employment_type', 'is_active']
    search_fields = ['user__first_name', 'user__last_name', 'employee_code', 'job_title']
    ordering_fields = ['hire_date', 'salary']

    def get_queryset(self):
        return Employee.objects.filter(
            organization__members__user=self.request.user,
            organization__members__is_active=True
        ).select_related('user', 'department').distinct()

    @action(detail=True, methods=['get'])
    def attendance_summary(self, request, pk=None):
        employee = self.get_object()
        today = date.today()
        month_start = today.replace(day=1)
        records = Attendance.objects.filter(employee=employee, date__gte=month_start, date__lte=today)
        return Response({
            'present': records.filter(status='present').count(),
            'absent': records.filter(status='absent').count(),
            'late': records.filter(status='late').count(),
            'on_leave': records.filter(status='on_leave').count(),
            'total_hours': float(records.aggregate(h=Sum('work_hours'))['h'] or 0),
        })

    @action(detail=True, methods=['get'])
    def leave_summary(self, request, pk=None):
        employee = self.get_object()
        year = date.today().year
        balances = LeaveBalance.objects.filter(employee=employee, year=year).select_related('leave_type')
        return Response(LeaveBalanceSerializer(balances, many=True).data)


class PayrollViewSet(viewsets.ModelViewSet):
    serializer_class = PayrollSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'status']

    def get_queryset(self):
        return Payroll.objects.filter(
            organization__members__user=self.request.user,
            organization__members__is_active=True
        ).select_related('employee__user').distinct()

    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        today = date.today()
        qs = Payroll.objects.filter(
            organization=org,
            period_start__year=today.year,
            period_start__month=today.month
        )
        return Response({
            'total_gross': float(qs.aggregate(s=Sum('base_salary'))['s'] or 0),
            'total_net': float(qs.aggregate(s=Sum('net_pay'))['s'] or 0),
            'total_employees': qs.count(),
            'paid': qs.filter(status='paid').count(),
            'pending': qs.filter(status__in=['draft', 'approved']).count(),
        })


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee', 'status', 'date']
    ordering_fields = ['date']

    def get_queryset(self):
        return Attendance.objects.filter(
            employee__organization__members__user=self.request.user,
            employee__organization__members__is_active=True
        ).select_related('employee__user').distinct()

    @action(detail=False, methods=['get'])
    def today_summary(self, request):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        today = date.today()
        records = Attendance.objects.filter(employee__organization=org, date=today)
        total_emp = Employee.objects.filter(organization=org, is_active=True).count()
        return Response({
            'total_employees': total_emp,
            'present': records.filter(status='present').count(),
            'absent': records.filter(status='absent').count(),
            'late': records.filter(status='late').count(),
            'on_leave': records.filter(status='on_leave').count(),
            'not_marked': total_emp - records.count(),
        })

    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        """Bulk mark attendance for all employees"""
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        today = date.today()
        employees = Employee.objects.filter(organization=org, is_active=True)
        created = 0
        for emp in employees:
            _, was_created = Attendance.objects.get_or_create(
                employee=emp, date=today,
                defaults={'status': request.data.get('status', 'present')}
            )
            if was_created:
                created += 1
        return Response({'marked': created})


class LeaveTypeViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LeaveType.objects.filter(
            organization__members__user=self.request.user,
            organization__members__is_active=True
        ).distinct()

    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee', 'leave_type', 'status']
    ordering_fields = ['start_date', 'created_at']

    def get_queryset(self):
        return LeaveRequest.objects.filter(
            employee__organization__members__user=self.request.user,
            employee__organization__members__is_active=True
        ).select_related('employee__user', 'leave_type').distinct()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({'error': 'Only pending requests can be approved'}, status=400)
        leave.status = 'approved'
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.review_comment = request.data.get('comment', '')
        leave.save()
        # Update balance
        balance, _ = LeaveBalance.objects.get_or_create(
            employee=leave.employee, leave_type=leave.leave_type,
            year=leave.start_date.year,
            defaults={'allocated': leave.leave_type.days_per_year}
        )
        balance.used += leave.days
        balance.pending = max(0, balance.pending - leave.days)
        balance.save()
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        leave = self.get_object()
        leave.status = 'rejected'
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.review_comment = request.data.get('comment', '')
        leave.save()
        balance = LeaveBalance.objects.filter(
            employee=leave.employee, leave_type=leave.leave_type, year=leave.start_date.year
        ).first()
        if balance:
            balance.pending = max(0, balance.pending - leave.days)
            balance.save()
        return Response(LeaveRequestSerializer(leave).data)

    def perform_create(self, serializer):
        leave = serializer.save()
        balance, _ = LeaveBalance.objects.get_or_create(
            employee=leave.employee, leave_type=leave.leave_type,
            year=leave.start_date.year,
            defaults={'allocated': leave.leave_type.days_per_year}
        )
        balance.pending += leave.days
        balance.save()


class PerformanceGoalViewSet(viewsets.ModelViewSet):
    serializer_class = PerformanceGoalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['employee', 'status', 'priority']
    search_fields = ['title']

    def get_queryset(self):
        return PerformanceGoal.objects.filter(
            employee__organization__members__user=self.request.user
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PerformanceReviewViewSet(viewsets.ModelViewSet):
    serializer_class = PerformanceReviewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'status', 'year', 'period']

    def get_queryset(self):
        return PerformanceReview.objects.filter(
            employee__organization__members__user=self.request.user
        ).select_related('employee__user', 'reviewer').distinct()

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        review = self.get_object()
        review.status = 'manager_review'
        review.save()
        return Response(PerformanceReviewSerializer(review).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        review = self.get_object()
        review.status = 'completed'
        review.completed_at = timezone.now()
        review.save()
        return Response(PerformanceReviewSerializer(review).data)


class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'category', 'assigned_to']
    search_fields = ['name', 'asset_tag', 'serial_number']

    def get_queryset(self):
        return Asset.objects.filter(
            organization__members__user=self.request.user,
            organization__members__is_active=True
        ).distinct()

    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        asset = self.get_object()
        employee_id = request.data.get('employee_id')
        employee = Employee.objects.filter(id=employee_id).first()
        if not employee:
            return Response({'error': 'Employee not found'}, status=400)
        asset.assigned_to = employee
        asset.assigned_at = timezone.now()
        asset.status = 'assigned'
        asset.save()
        return Response(AssetSerializer(asset).data)

    @action(detail=True, methods=['post'])
    def unassign(self, request, pk=None):
        asset = self.get_object()
        asset.assigned_to = None
        asset.assigned_at = None
        asset.status = 'available'
        asset.save()
        return Response(AssetSerializer(asset).data)
