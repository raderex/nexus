from rest_framework import serializers
from .models import TimeLog, ActivityLog, Screenshot, ProductivityMetric, TimeLogApproval, AppUsage


class TimeLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    task_title = serializers.CharField(source='task.title', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    duration_hours = serializers.SerializerMethodField()
    class Meta:
        model = TimeLog
        fields = '__all__'
    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()
    def get_duration_hours(self, obj):
        return round((obj.duration_seconds or 0) / 3600, 2)


class TimeLogApprovalSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    reviewer_name = serializers.SerializerMethodField()
    log_description = serializers.CharField(source='time_log.description', read_only=True)
    log_hours = serializers.SerializerMethodField()
    class Meta:
        model = TimeLogApproval
        fields = '__all__'
    def get_employee_name(self, obj):
        return obj.time_log.employee.user.get_full_name()
    def get_reviewer_name(self, obj):
        return obj.reviewed_by.get_full_name() if obj.reviewed_by else None
    def get_log_hours(self, obj):
        return round((obj.time_log.duration_seconds or 0) / 3600, 2)


class ActivityLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    class Meta:
        model = ActivityLog
        fields = '__all__'
    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()


class ScreenshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Screenshot
        fields = '__all__'

    def validate_image(self, value):
        from apps.core.validators import validate_image
        validate_image(value)
        return value


class ProductivityMetricSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    class Meta:
        model = ProductivityMetric
        fields = '__all__'
    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()


class AppUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUsage
        fields = '__all__'
