from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone
from django.db.models import Q
from .models import Organization

@shared_task
def send_daily_summary_reports():
    """Send daily summary emails to all organization admins."""
    for org in Organization.objects.filter(is_active=True):
        admins = org.members.filter(role__in=['owner', 'admin'])
        for admin in admins:
            if admin.user.email:
                send_mail(
                    subject=f'Nexus Daily Summary - {org.name}',
                    message=f'Your daily summary for {org.name} is ready.',
                    from_email='noreply@nexus.app',
                    recipient_list=[admin.user.email],
                    fail_silently=True,
                )
    return "Daily reports sent"


@shared_task
def send_leave_approval_reminders():
    """Send reminders for pending leave requests needing approval."""
    from apps.hrm.models import LeaveRequest
    now = timezone.now()
    pending = LeaveRequest.objects.filter(
        status='pending',
        start_date__gte=now.date()
    ).select_related('employee__user', 'leave_type', 'employee__organization')
    sent = 0
    for leave in pending:
        org = leave.employee.organization
        admins = org.members.filter(role__in=['owner', 'admin'])
        for admin in admins:
            if admin.user.email:
                send_mail(
                    subject=f'Leave Request Pending - {leave.employee.user.get_full_name()}',
                    message=(
                        f'{leave.employee.user.get_full_name()} has requested {leave.days} days of '
                        f'{leave.leave_type.name} starting {leave.start_date}.\n\n'
                        f'Reason: {leave.reason}\n\n'
                        f'Please review in the Nexus app.'
                    ),
                    from_email='noreply@nexus.app',
                    recipient_list=[admin.user.email],
                    fail_silently=True,
                )
                sent += 1
    return f"Sent {sent} leave approval reminders"


@shared_task
def send_invoice_overdue_reminders():
    """Send reminders for overdue invoices."""
    from apps.erp.models import Invoice
    overdue = Invoice.objects.filter(
        status__in=['sent', 'overdue'],
        due_date__lt=timezone.now().date()
    ).select_related('organization', 'contact')
    sent = 0
    for invoice in overdue:
        if invoice.due_date:
            days_overdue = (timezone.now().date() - invoice.due_date).days
            org = invoice.organization
            admins = org.members.filter(role__in=['owner', 'admin'])
            for admin in admins:
                if admin.user.email:
                    send_mail(
                        subject=f'Invoice Overdue - {invoice.invoice_number}',
                        message=(
                            f'Invoice {invoice.invoice_number} for {invoice.contact_name} '
                            f'is {days_overdue} days overdue.\n'
                            f'Amount: {invoice.currency} {invoice.total_amount}\n'
                            f'Due Date: {invoice.due_date}\n\n'
                            f'Please follow up with the client.'
                        ),
                        from_email='noreply@nexus.app',
                        recipient_list=[admin.user.email],
                        fail_silently=True,
                    )
                    sent += 1
    return f"Sent {sent} invoice overdue reminders"
