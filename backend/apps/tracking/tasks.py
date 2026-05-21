from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import TimeLog, ActivityLog, ProductivityMetric
from apps.hrm.models import Employee

@shared_task
def generate_daily_productivity_metrics():
    """Generate productivity metrics for all employees for today."""
    today = timezone.now().date()
    employees = Employee.objects.filter(is_active=True)
    for employee in employees:
        time_logs = TimeLog.objects.filter(
            employee=employee,
            started_at__date=today
        )
        total_hours = sum(
            log.duration_seconds / 3600 
            for log in time_logs 
            if log.duration_seconds
        )

        activity = ActivityLog.objects.filter(
            employee=employee,
            date=today
        ).first()

        ProductivityMetric.objects.update_or_create(
            employee=employee,
            date=today,
            defaults={
                'tasks_completed': 0,
                'hours_worked': total_hours,
                'efficiency_score': activity.productivity_score if activity else 0,
                'focus_score': 0,
                'collaboration_score': 0,
                'overall_score': activity.productivity_score if activity else 0,
            }
        )
    return f"Generated metrics for {employees.count()} employees"
