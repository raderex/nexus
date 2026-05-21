from django.db import models
import uuid


class Pipeline(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='pipelines')
    name = models.CharField(max_length=255)
    stages = models.JSONField(default=list)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pipelines'

    def __str__(self):
        return self.name


class Contact(models.Model):
    TYPE = [('lead','Lead'),('customer','Customer'),('partner','Partner'),('vendor','Vendor'),('other','Other')]
    STATUS = [('active','Active'),('inactive','Inactive'),('converted','Converted'),('lost','Lost')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='contacts')
    type = models.CharField(max_length=50, choices=TYPE, default='lead')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    company = models.CharField(max_length=255, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    social_links = models.JSONField(default=dict, blank=True)
    tags = models.JSONField(default=list, blank=True)
    source = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=50, choices=STATUS, default='active')
    assigned_to = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_contacts')
    notes = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='contact_avatars/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contacts'

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()


class Deal(models.Model):
    STATUS = [('open','Open'),('won','Won'),('lost','Lost')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='deals')
    pipeline = models.ForeignKey(Pipeline, on_delete=models.CASCADE, related_name='deals')
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='deals')
    title = models.CharField(max_length=255)
    value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')
    stage = models.CharField(max_length=100)
    probability = models.IntegerField(default=0)
    expected_close_date = models.DateField(null=True, blank=True)
    actual_close_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS, default='open')
    assigned_to = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_deals')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'deals'

    def __str__(self):
        return self.title


class Activity(models.Model):
    TYPE = [('call','Call'),('email','Email'),('meeting','Meeting'),('task','Task'),('note','Note'),('sms','SMS')]
    STATUS = [('pending','Pending'),('completed','Completed'),('overdue','Overdue')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='activities')
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    activity_type = models.CharField(max_length=50, choices=TYPE)
    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS, default='pending')
    assigned_to = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='crm_activities')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activities'

    def __str__(self):
        return self.subject
