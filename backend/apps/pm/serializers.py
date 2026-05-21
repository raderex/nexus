from rest_framework import serializers
from .models import Project, Milestone, Task, TaskComment, TaskAttachment, Sprint
from apps.core.serializers import UserSerializer


class SprintSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()
    class Meta:
        model = Sprint
        fields = '__all__'
    def get_task_count(self, obj):
        return obj.tasks.count() if hasattr(obj, 'tasks') else 0


class MilestoneSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()
    class Meta:
        model = Milestone
        fields = '__all__'
    def get_task_count(self, obj):
        return obj.tasks.count()


class TaskCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    class Meta:
        model = TaskComment
        fields = '__all__'
    def get_author_name(self, obj):
        return obj.author.get_full_name()
    def get_author_avatar(self, obj):
        return obj.author.avatar.url if obj.author.avatar else None


class TaskAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskAttachment
        fields = '__all__'


class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.SerializerMethodField()
    reporter_name = serializers.SerializerMethodField()
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_color = serializers.CharField(source='project.color', read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    subtask_count = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    class Meta:
        model = Task
        fields = '__all__'
    def get_assignee_name(self, obj):
        return obj.assignee.get_full_name() if obj.assignee else None
    def get_reporter_name(self, obj):
        return obj.reporter.get_full_name() if obj.reporter else None
    def get_subtask_count(self, obj):
        return obj.subtasks.count()
    def get_is_overdue(self, obj):
        from django.utils import timezone
        return obj.due_date and obj.due_date < timezone.now().date() and obj.status not in ['done', 'cancelled']


class ProjectSerializer(serializers.ModelSerializer):
    manager_name = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()
    team_members = UserSerializer(many=True, read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    class Meta:
        model = Project
        fields = '__all__'
    def get_manager_name(self, obj):
        return obj.manager.get_full_name() if obj.manager else None
    def get_task_count(self, obj):
        return obj.tasks.count()
    def get_completed_tasks(self, obj):
        return obj.tasks.filter(status='done').count()
