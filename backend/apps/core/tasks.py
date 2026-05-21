from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone
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
