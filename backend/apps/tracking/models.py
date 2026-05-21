from django.db import models
import uuid


class TimeLog(models.Model):
    SOURCE = [('manual','Manual'),('timer','Timer'),('desktop','Desktop App'),('mobile','Mobile App')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey('hrm.Employee', on_delete=models.CASCADE, related_name='time_logs')
    task = models.ForeignKey('pm.Task', on_delete=models.SET_NULL, null=True, blank=True, related_name='time_logs')
    project = models.ForeignKey('pm.Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='time_logs')
    description = models.TextField(blank=True)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    is_billable = models.BooleanField(default=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    source = models.CharField(max_length=50, choices=SOURCE, default='manual')
    is_running = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'time_logs'

    def __str__(self):
        return f"{self.employee} — {self.started_at}"


class ActivityLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey('hrm.Employee', on_delete=models.CASCADE, related_name='activity_logs')
    date = models.DateField()
    total_active_seconds = models.IntegerField(default=0)
    total_idle_seconds = models.IntegerField(default=0)
    mouse_clicks = models.IntegerField(default=0)
    keyboard_strokes = models.IntegerField(default=0)
    activity_level = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    productivity_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    apps_used = models.JSONField(default=list, blank=True)
    websites_visited = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activity_logs'
        unique_together = ['employee', 'date']

    def __str__(self):
        return f"{self.employee} — {self.date}"


class Screenshot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey('hrm.Employee', on_delete=models.CASCADE, related_name='screenshots')
    time_log = models.ForeignKey(TimeLog, on_delete=models.CASCADE, related_name='screenshots', null=True, blank=True)
    image = models.ImageField(upload_to='screenshots/%Y/%m/%d/')
    thumbnail = models.ImageField(upload_to='screenshots/thumbs/%Y/%m/%d/', null=True, blank=True)
    captured_at = models.DateTimeField()
    activity_level = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_blurred = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'screenshots'


class ProductivityMetric(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey('hrm.Employee', on_delete=models.CASCADE, related_name='productivity_metrics')
    date = models.DateField()
    tasks_completed = models.IntegerField(default=0)
    hours_worked = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    efficiency_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    focus_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    collaboration_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    overall_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'productivity_metrics'
        unique_together = ['employee', 'date']


# ── Time Approval Workflow (ever-gauzy: time tracking approval) ────────────

class TimeLogApproval(models.Model):
    STATUS = [('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    time_log = models.OneToOneField(TimeLog, on_delete=models.CASCADE, related_name='approval')
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_time_logs')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    comment = models.TextField(blank=True)

    class Meta:
        db_table = 'time_log_approvals'

    def __str__(self):
        return f"Approval: {self.time_log} ({self.status})"


# ── App Usage Tracking (ever-gauzy: desktop agent) ────────────────────────

class AppUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity_log = models.ForeignKey(ActivityLog, on_delete=models.CASCADE, related_name='app_usages')
    app_name = models.CharField(max_length=255)
    app_identifier = models.CharField(max_length=255, blank=True)
    duration_seconds = models.IntegerField(default=0)
    is_productive = models.BooleanField(default=True)
    category = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'app_usages'

    def __str__(self):
        return f"{self.app_name} — {self.duration_seconds}s"
