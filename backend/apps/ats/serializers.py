from rest_framework import serializers
from .models import JobPosting, Applicant, Interview, OfferLetter, InterviewScorecard


class JobPostingSerializer(serializers.ModelSerializer):
    applicant_count = serializers.IntegerField(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    class Meta:
        model = JobPosting
        fields = '__all__'


class ApplicantSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    full_name = serializers.SerializerMethodField()
    interview_count = serializers.SerializerMethodField()
    class Meta:
        model = Applicant
        fields = '__all__'
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    def get_interview_count(self, obj):
        return obj.interviews.count()


class InterviewSerializer(serializers.ModelSerializer):
    applicant_name = serializers.SerializerMethodField()
    interviewer_name = serializers.CharField(source='interviewer.get_full_name', read_only=True)
    job_title = serializers.CharField(source='applicant.job.title', read_only=True)
    class Meta:
        model = Interview
        fields = '__all__'
    def get_applicant_name(self, obj):
        return f"{obj.applicant.first_name} {obj.applicant.last_name}".strip()


class OfferLetterSerializer(serializers.ModelSerializer):
    applicant_name = serializers.SerializerMethodField()
    job_title = serializers.CharField(source='job.title', read_only=True)
    class Meta:
        model = OfferLetter
        fields = '__all__'
    def get_applicant_name(self, obj):
        return f"{obj.applicant.first_name} {obj.applicant.last_name}".strip()


class InterviewScorecardSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewScorecard
        fields = '__all__'
