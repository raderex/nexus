from django.db import models
import uuid


class SocialAccount(models.Model):
    PLATFORMS = [('facebook','Facebook'),('twitter','X / Twitter'),('instagram','Instagram'),('linkedin','LinkedIn'),
                 ('youtube','YouTube'),('tiktok','TikTok'),('pinterest','Pinterest'),('reddit','Reddit')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='social_accounts')
    platform = models.CharField(max_length=50, choices=PLATFORMS)
    account_name = models.CharField(max_length=255)
    account_handle = models.CharField(max_length=255, blank=True)
    access_token = models.TextField(blank=True)
    refresh_token = models.TextField(blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    follower_count = models.IntegerField(default=0)
    profile_url = models.URLField(blank=True)
    profile_image = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    is_connected = models.BooleanField(default=False)
    last_synced = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'social_accounts'

    def __str__(self):
        return f"{self.platform} — {self.account_name}"


class SocialPost(models.Model):
    STATUS = [('draft','Draft'),('scheduled','Scheduled'),('publishing','Publishing'),
              ('published','Published'),('failed','Failed'),('cancelled','Cancelled')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='social_posts')
    author = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)
    content = models.TextField()
    media_urls = models.JSONField(default=list, blank=True)
    platforms = models.JSONField(default=list)
    status = models.CharField(max_length=50, choices=STATUS, default='draft')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    engagement_stats = models.JSONField(default=dict, blank=True)
    ai_generated = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'social_posts'

    def __str__(self):
        return f"{self.platforms} — {self.content[:50]}"


class SocialMessage(models.Model):
    MSG_TYPE = [('dm','Direct Message'),('mention','Mention'),('comment','Comment'),('review','Review'),('email','Email')]
    SENTIMENT = [('positive','Positive'),('neutral','Neutral'),('negative','Negative')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='social_messages')
    social_account = models.ForeignKey(SocialAccount, on_delete=models.CASCADE, related_name='messages')
    platform_message_id = models.CharField(max_length=255, blank=True)
    sender_name = models.CharField(max_length=255)
    sender_handle = models.CharField(max_length=255, blank=True)
    sender_avatar = models.URLField(blank=True)
    content = models.TextField()
    message_type = models.CharField(max_length=50, choices=MSG_TYPE)
    is_read = models.BooleanField(default=False)
    is_replied = models.BooleanField(default=False)
    sentiment = models.CharField(max_length=20, choices=SENTIMENT, default='neutral')
    received_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'social_messages'

    def __str__(self):
        return f"{self.sender_name} via {self.social_account.platform}"


class Campaign(models.Model):
    OBJECTIVE = [('awareness','Brand Awareness'),('engagement','Engagement'),('traffic','Traffic'),('leads','Lead Generation'),('sales','Sales')]
    STATUS = [('draft','Draft'),('active','Active'),('paused','Paused'),('completed','Completed')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='campaigns')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    objective = models.CharField(max_length=50, choices=OBJECTIVE)
    platforms = models.JSONField(default=list)
    budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=50, choices=STATUS, default='draft')
    posts = models.ManyToManyField(SocialPost, related_name='campaigns', blank=True)
    performance = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'campaigns'

    def __str__(self):
        return self.name


# ── Media Files (postiz: media library) ───────────────────────────────────

class MediaFile(models.Model):
    TYPE = [('image', 'Image'), ('video', 'Video'), ('gif', 'GIF'), ('document', 'Document')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='media_files')
    uploaded_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)
    file = models.FileField(upload_to='social_media/%Y/%m/')
    thumbnail = models.ImageField(upload_to='social_media/thumbs/', null=True, blank=True)
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=TYPE)
    size_bytes = models.IntegerField(default=0)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    alt_text = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'media_files'

    def __str__(self):
        return self.filename


# ── Post Analytics (postiz: analytics module) ─────────────────────────────

class PostAnalytic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(SocialPost, on_delete=models.CASCADE, related_name='analytics')
    social_account = models.ForeignKey(SocialAccount, on_delete=models.CASCADE)
    platform_post_id = models.CharField(max_length=255, blank=True)
    impressions = models.IntegerField(default=0)
    reach = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)
    comments = models.IntegerField(default=0)
    shares = models.IntegerField(default=0)
    saves = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    video_views = models.IntegerField(default=0)
    engagement_rate = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    synced_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'post_analytics'
        unique_together = ['post', 'social_account']

    def __str__(self):
        return f"{self.post} — {self.social_account.platform}"


# ── Webhook (postiz: platform webhooks) ───────────────────────────────────

class Webhook(models.Model):
    EVENT_TYPES = [
        ('new_message', 'New Message'), ('new_comment', 'New Comment'),
        ('new_mention', 'New Mention'), ('post_published', 'Post Published'),
        ('post_failed', 'Post Failed'), ('follow', 'New Follower'),
    ]
    STATUS = [('active', 'Active'), ('inactive', 'Inactive'), ('failed', 'Failed')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='webhooks')
    social_account = models.ForeignKey(SocialAccount, on_delete=models.CASCADE, related_name='webhooks', null=True, blank=True)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    target_url = models.URLField(blank=True)
    secret = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='active')
    last_triggered = models.DateTimeField(null=True, blank=True)
    fail_count = models.IntegerField(default=0)
    payload_log = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'webhooks'


# ── Hashtag (postiz: hashtag suggestions) ─────────────────────────────────

class Hashtag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='hashtags')
    tag = models.CharField(max_length=100)
    platform = models.CharField(max_length=50)
    usage_count = models.IntegerField(default=0)
    avg_reach = models.IntegerField(default=0)
    category = models.CharField(max_length=100, blank=True)
    is_trending = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hashtags'
        unique_together = ['organization', 'tag', 'platform']

    def __str__(self):
        return f"#{self.tag} ({self.platform})"


# ── Content Queue (postiz: post queue) ────────────────────────────────────

class PostQueue(models.Model):
    STATUS = [('waiting', 'Waiting'), ('processing', 'Processing'),
              ('published', 'Published'), ('failed', 'Failed'), ('cancelled', 'Cancelled')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.OneToOneField(SocialPost, on_delete=models.CASCADE, related_name='queue')
    social_account = models.ForeignKey(SocialAccount, on_delete=models.CASCADE)
    scheduled_at = models.DateTimeField()
    processed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='waiting')
    platform_post_id = models.CharField(max_length=255, blank=True)
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'post_queue'
        ordering = ['scheduled_at']

    def __str__(self):
        return f"Queue: {self.post} @ {self.scheduled_at}"
