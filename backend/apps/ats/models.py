from django.db import models
import uuid


class JobPosting(models.Model):
    STATUS = [('draft','Draft'),('published','Published'),('paused','Paused'),('closed','Closed'),('filled','Filled')]
    EMP_TYPE = [('full_time','Full Time'),('part_time','Part Time'),('contract','Contract'),('intern','Intern')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='job_postings')
    title = models.CharField(max_length=255)
    department = models.ForeignKey('hrm.Department', on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    responsibilities = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    employment_type = models.CharField(max_length=50, choices=EMP_TYPE, default='full_time')
    salary_min = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=50, choices=STATUS, default='draft')
    posted_at = models.DateTimeField(null=True, blank=True)
    closes_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'job_postings'

    def __str__(self):
        return self.title


class Applicant(models.Model):
    STAGE = [('new','New'),('screening','Screening'),('interview','Interview'),('assessment','Assessment'),
             ('offer','Offer'),('hired','Hired'),('rejected','Rejected'),('withdrawn','Withdrawn')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='applicants')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    cover_letter = models.TextField(blank=True)
    portfolio_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    source = models.CharField(max_length=100, blank=True)
    stage = models.CharField(max_length=50, choices=STAGE, default='new')
    rating = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'applicants'

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.job.title}"


class Interview(models.Model):
    STATUS = [('scheduled','Scheduled'),('completed','Completed'),('cancelled','Cancelled'),('no_show','No Show')]
    TYPE = [('phone','Phone'),('video','Video'),('in_person','In-Person'),('technical','Technical'),('panel','Panel')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applicant = models.ForeignKey(Applicant, on_delete=models.CASCADE, related_name='interviews')
    interviewer = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    location = models.CharField(max_length=255, blank=True)
    meeting_link = models.URLField(blank=True)
    interview_type = models.CharField(max_length=50, choices=TYPE, default='video')
    status = models.CharField(max_length=50, choices=STATUS, default='scheduled')
    feedback = models.TextField(blank=True)
    score = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'interviews'

    def __str__(self):
        return f"{self.applicant} — {self.interview_type}"


# ── Offer Letter (ever-gauzy: ATS offer module) ────────────────────────────

class OfferLetter(models.Model):
    STATUS = [('draft', 'Draft'), ('sent', 'Sent'), ('accepted', 'Accepted'),
              ('rejected', 'Rejected'), ('expired', 'Expired'), ('revoked', 'Revoked')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applicant = models.OneToOneField(Applicant, on_delete=models.CASCADE, related_name='offer_letter')
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS, default='draft')
    salary = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    start_date = models.DateField(null=True, blank=True)
    expires_at = models.DateField(null=True, blank=True)
    benefits = models.TextField(blank=True)
    conditions = models.TextField(blank=True)
    letter_html = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'offer_letters'

    def __str__(self):
        return f"Offer — {self.applicant} ({self.status})"


# ── Evaluation / Scorecard (ever-gauzy: interview scoring) ─────────────────

class InterviewScorecard(models.Model):
    RATING = [(1, 'Poor'), (2, 'Below Average'), (3, 'Average'), (4, 'Good'), (5, 'Excellent')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    interview = models.OneToOneField(Interview, on_delete=models.CASCADE, related_name='scorecard')
    technical_skills = models.IntegerField(choices=RATING, null=True, blank=True)
    communication = models.IntegerField(choices=RATING, null=True, blank=True)
    problem_solving = models.IntegerField(choices=RATING, null=True, blank=True)
    culture_fit = models.IntegerField(choices=RATING, null=True, blank=True)
    experience = models.IntegerField(choices=RATING, null=True, blank=True)
    overall = models.IntegerField(choices=RATING, null=True, blank=True)
    strengths = models.TextField(blank=True)
    concerns = models.TextField(blank=True)
    recommendation = models.CharField(max_length=20, choices=[
        ('strong_yes', 'Strong Yes'), ('yes', 'Yes'), ('maybe', 'Maybe'),
        ('no', 'No'), ('strong_no', 'Strong No')
    ], blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'interview_scorecards'
