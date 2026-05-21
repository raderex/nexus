from django.db import models
import uuid


class Project(models.Model):
    STATUS = [('planning','Planning'),('active','Active'),('on_hold','On Hold'),('completed','Completed'),('cancelled','Cancelled')]
    PRIORITY = [('low','Low'),('medium','Medium'),('high','High'),('urgent','Urgent')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50, choices=STATUS, default='planning')
    priority = models.CharField(max_length=50, choices=PRIORITY, default='medium')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')
    progress = models.IntegerField(default=0)
    client = models.ForeignKey('crm.Contact', on_delete=models.SET_NULL, null=True, blank=True)
    manager = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='managed_projects')
    team_members = models.ManyToManyField('core.User', related_name='projects', blank=True)
    tags = models.JSONField(default=list, blank=True)
    color = models.CharField(max_length=7, default='#6366f1')
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'

    def __str__(self):
        return self.name


class Milestone(models.Model):
    STATUS = [('pending','Pending'),('in_progress','In Progress'),('completed','Completed'),('overdue','Overdue')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'milestones'

    def __str__(self):
        return f"{self.project.name} — {self.name}"


class Task(models.Model):
    STATUS = [('backlog','Backlog'),('todo','To Do'),('in_progress','In Progress'),('review','Review'),('done','Done')]
    PRIORITY = [('low','Low'),('medium','Medium'),('high','High'),('urgent','Urgent')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    milestone = models.ForeignKey(Milestone, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50, choices=STATUS, default='todo')
    priority = models.CharField(max_length=50, choices=PRIORITY, default='medium')
    assignee = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    reporter = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='reported_tasks')
    due_date = models.DateField(null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    progress = models.IntegerField(default=0)
    tags = models.JSONField(default=list, blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tasks'

    def __str__(self):
        return self.title


class TaskComment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey('core.User', on_delete=models.CASCADE)
    content = models.TextField()
    attachments = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'task_comments'


# ── Sprint (ever-gauzy: sprint/scrum board) ────────────────────────────────

class Sprint(models.Model):
    STATUS = [('planned', 'Planned'), ('active', 'Active'), ('completed', 'Completed')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sprints')
    name = models.CharField(max_length=255)
    goal = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='planned')
    start_date = models.DateField()
    end_date = models.DateField()
    velocity = models.IntegerField(default=0, help_text='Story points completed')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sprints'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.project.name} — {self.name}"


class TaskAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)
    file = models.FileField(upload_to='task_attachments/%Y/%m/')
    filename = models.CharField(max_length=255)
    size_bytes = models.IntegerField(default=0)
    content_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'task_attachments'
