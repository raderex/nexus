import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nexus.settings')

app = Celery('nexus')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'sync-social-accounts': {
        'task': 'apps.social.tasks.sync_all_social_accounts',
        'schedule': crontab(minute='*/15'),
    },
    'publish-scheduled-posts': {
        'task': 'apps.social.tasks.publish_scheduled_posts',
        'schedule': crontab(minute='*/5'),
    },
    'generate-daily-productivity': {
        'task': 'apps.tracking.tasks.generate_daily_productivity_metrics',
        'schedule': crontab(hour=23, minute=55),
    },
    'send-daily-reports': {
        'task': 'apps.core.tasks.send_daily_summary_reports',
        'schedule': crontab(hour=8, minute=0),
    },
}
