from celery import shared_task
from django.utils import timezone
from .models import SocialPost, SocialAccount

@shared_task
def publish_scheduled_posts():
    """Publish posts that are scheduled and due."""
    now = timezone.now()
    posts = SocialPost.objects.filter(
        status='scheduled',
        scheduled_at__lte=now
    )
    for post in posts:
        # Here you would call the actual social media APIs
        # For now, mark as published
        post.status = 'published'
        post.published_at = now
        post.save()
    return f"Published {posts.count()} posts"

@shared_task
def sync_all_social_accounts():
    """Sync follower counts and messages from all connected social accounts."""
    accounts = SocialAccount.objects.filter(is_connected=True)
    for account in accounts:
        # Here you would call each platform's API
        # For now, just update the sync timestamp
        account.last_synced = timezone.now()
        account.save()
    return f"Synced {accounts.count()} accounts"
