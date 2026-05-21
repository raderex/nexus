from django.db import models
import uuid


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=7, default='#6366f1')
    manager = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_departments')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'departments'

    def __str__(self):
        return self.name


class Employee(models.Model):
    EMP_TYPE = [('full_time','Full Time'),('part_time','Part Time'),('contract','Contract'),('intern','Intern'),('freelance','Freelance')]
    LEVEL = [('junior','Junior'),('mid','Mid-Level'),('senior','Senior'),('lead','Lead'),('manager','Manager'),('director','Director'),('executive','Executive')]
    SALARY_PERIOD = [('hourly','Hourly'),('daily','Daily'),('weekly','Weekly'),('biweekly','Bi-Weekly'),('monthly','Monthly'),('yearly','Yearly')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='employees')
    user = models.OneToOneField('core.User', on_delete=models.CASCADE, related_name='employee_profile')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    employee_code = models.CharField(max_length=50, unique=True)
    job_title = models.CharField(max_length=100)
    employment_type = models.CharField(max_length=50, choices=EMP_TYPE, default='full_time')
    level = models.CharField(max_length=50, choices=LEVEL, default='junior')
    salary = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')
    salary_period = models.CharField(max_length=20, choices=SALARY_PERIOD, default='monthly')
    hire_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    work_hours_per_day = models.DecimalField(max_digits=4, decimal_places=2, default=8)
    work_days_per_week = models.IntegerField(default=5)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'employees'

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_code})"


class Payroll(models.Model):
    STATUS = [('draft','Draft'),('approved','Approved'),('paid','Paid')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='payrolls')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payrolls')
    period_start = models.DateField()
    period_end = models.DateField()
    base_salary = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    bonus = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    net_pay = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=50, choices=STATUS, default='draft')
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payrolls'

    def __str__(self):
        return f"{self.employee} {self.period_start}"


class Attendance(models.Model):
    STATUS = [('present','Present'),('absent','Absent'),('late','Late'),('half_day','Half Day'),('on_leave','On Leave'),('remote','Remote')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS, default='present')
    work_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attendances'
        unique_together = ['employee', 'date']

    def __str__(self):
        return f"{self.employee} {self.date} {self.status}"


# ── Leave Management (ever-gauzy: leave module) ────────────────────────────

class LeaveType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='leave_types')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    color = models.CharField(max_length=7, default='#6366f1')
    days_per_year = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    is_paid = models.BooleanField(default=True)
    requires_approval = models.BooleanField(default=True)
    carry_forward = models.BooleanField(default=False)
    max_carry_forward_days = models.IntegerField(default=0)
    allow_half_day = models.BooleanField(default=True)
    min_notice_days = models.IntegerField(default=0)
    max_consecutive_days = models.IntegerField(default=0, help_text='0 = unlimited')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'leave_types'
        unique_together = ['organization', 'code']

    def __str__(self):
        return f"{self.name} ({self.code})"


class LeaveBalance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_balances')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name='balances')
    year = models.IntegerField()
    allocated = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    used = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    carried_forward = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    pending = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'leave_balances'
        unique_together = ['employee', 'leave_type', 'year']

    @property
    def available(self):
        return self.allocated + self.carried_forward - self.used - self.pending

    def __str__(self):
        return f"{self.employee} — {self.leave_type} {self.year}"


class LeaveRequest(models.Model):
    STATUS = [
        ('pending', 'Pending'), ('approved', 'Approved'),
        ('rejected', 'Rejected'), ('cancelled', 'Cancelled'), ('withdrawn', 'Withdrawn')
    ]
    DURATION = [('full_day', 'Full Day'), ('half_day_am', 'Half Day AM'), ('half_day_pm', 'Half Day PM')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT)
    start_date = models.DateField()
    end_date = models.DateField()
    duration_type = models.CharField(max_length=20, choices=DURATION, default='full_day')
    days = models.DecimalField(max_digits=5, decimal_places=1)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    reviewed_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_leaves')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_comment = models.TextField(blank=True)
    attachment = models.FileField(upload_to='leave_attachments/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'leave_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee} — {self.leave_type} {self.start_date}"


# ── Performance Reviews (ever-gauzy: appraisal module) ────────────────────

class PerformanceGoal(models.Model):
    STATUS = [('active', 'Active'), ('completed', 'Completed'), ('cancelled', 'Cancelled')]
    PRIORITY = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY, default='medium')
    status = models.CharField(max_length=20, choices=STATUS, default='active')
    target_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unit = models.CharField(max_length=50, blank=True)
    progress = models.IntegerField(default=0)
    due_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'performance_goals'

    def __str__(self):
        return f"{self.employee} — {self.title}"


class PerformanceReview(models.Model):
    STATUS = [('draft', 'Draft'), ('self_review', 'Self Review'), ('manager_review', 'Manager Review'),
              ('completed', 'Completed'), ('acknowledged', 'Acknowledged')]
    PERIOD = [('q1', 'Q1'), ('q2', 'Q2'), ('q3', 'Q3'), ('q4', 'Q4'), ('h1', 'H1'), ('h2', 'H2'), ('annual', 'Annual')]
    RATING = [(1, '1 - Needs Improvement'), (2, '2 - Below Expectations'), (3, '3 - Meets Expectations'),
              (4, '4 - Exceeds Expectations'), (5, '5 - Outstanding')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_reviews')
    reviewer = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='given_reviews')
    period = models.CharField(max_length=20, choices=PERIOD, default='annual')
    year = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS, default='draft')
    # Ratings
    goals_rating = models.IntegerField(choices=RATING, null=True, blank=True)
    skills_rating = models.IntegerField(choices=RATING, null=True, blank=True)
    teamwork_rating = models.IntegerField(choices=RATING, null=True, blank=True)
    communication_rating = models.IntegerField(choices=RATING, null=True, blank=True)
    leadership_rating = models.IntegerField(choices=RATING, null=True, blank=True)
    overall_rating = models.IntegerField(choices=RATING, null=True, blank=True)
    # Feedback text
    self_assessment = models.TextField(blank=True)
    manager_feedback = models.TextField(blank=True)
    strengths = models.TextField(blank=True)
    areas_for_improvement = models.TextField(blank=True)
    goals_next_period = models.TextField(blank=True)
    employee_comments = models.TextField(blank=True)
    # Outcomes
    salary_increase_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    promotion_recommended = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'performance_reviews'
        ordering = ['-year', '-created_at']

    def __str__(self):
        return f"Review — {self.employee} {self.period} {self.year}"


# ── Asset / Equipment Tracking (ever-gauzy: equipment module) ─────────────

class Asset(models.Model):
    STATUS = [('available', 'Available'), ('assigned', 'Assigned'),
              ('maintenance', 'Under Maintenance'), ('retired', 'Retired'), ('lost', 'Lost')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='assets')
    name = models.CharField(max_length=255)
    asset_tag = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100)
    brand = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=255, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    purchase_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    current_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='available')
    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_assets')
    assigned_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    image = models.ImageField(upload_to='assets/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assets'

    def __str__(self):
        return f"{self.name} ({self.asset_tag})"
