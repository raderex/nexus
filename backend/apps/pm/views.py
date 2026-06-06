from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Count, Sum, Q

from .models import Project, Milestone, Task, TaskComment, TaskAttachment, Sprint
from .serializers import (ProjectSerializer, MilestoneSerializer, TaskSerializer,
                           TaskCommentSerializer, SprintSerializer, TaskAttachmentSerializer)
from apps.core.permissions import IsOrgEditorOrReadOnly, IsOrgAdmin


class ProjectViewSet(viewsets.ModelViewSet):
    """Projects - editors can manage, viewers read-only, delete admin-only."""
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'is_archived']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'end_date', 'progress']

    def get_queryset(self):
        return Project.objects.filter(
            organization__members__user=self.request.user,
            organization__members__is_active=True
        ).prefetch_related('team_members', 'milestones').order_by('-created_at').distinct()

    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        if not org:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("No active organization found.")
        project = serializer.save(organization=org, manager=self.request.user)
        project.team_members.add(self.request.user)

    @action(detail=True, methods=['get'])
    def task_board(self, request, pk=None):
        project = self.get_object()
        statuses = ['backlog', 'todo', 'in_progress', 'review', 'done']
        board = {}
        for s in statuses:
            tasks = Task.objects.filter(project=project, status=s, parent=None)
            board[s] = TaskSerializer(tasks, many=True).data
        return Response(board)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        project = self.get_object()
        tasks = Task.objects.filter(project=project)
        return Response({
            'total_tasks': tasks.count(),
            'completed': tasks.filter(status='done').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'overdue': tasks.filter(due_date__lt=timezone.now().date(), status__in=['todo','in_progress','review']).count(),
            'total_hours': float(tasks.aggregate(h=Sum('actual_hours'))['h'] or 0),
            'estimated_hours': float(tasks.aggregate(h=Sum('estimated_hours'))['h'] or 0),
            'team_count': project.team_members.count(),
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOrgEditorOrReadOnly])
    def add_member(self, request, pk=None):
        project = self.get_object()
        from apps.core.models import User
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
            project.team_members.add(user)
            return Response({'status': 'added'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=400)


class SprintViewSet(viewsets.ModelViewSet):
    """Sprints - editors can manage, viewers read-only."""
    serializer_class = SprintSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'status']

    def get_queryset(self):
        return Sprint.objects.filter(
            project__organization__members__user=self.request.user
        ).order_by('-created_at').distinct()

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        sprint = self.get_object()
        Sprint.objects.filter(project=sprint.project, status='active').update(status='completed')
        sprint.status = 'active'
        sprint.save()
        return Response(SprintSerializer(sprint).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        sprint = self.get_object()
        incomplete = Task.objects.filter(sprint=sprint).exclude(status='done')
        sprint.status = 'completed'
        sprint.save()
        return Response({
            **SprintSerializer(sprint).data,
            'incomplete_tasks': incomplete.count(),
        })

    @action(detail=True, methods=['get'])
    def burndown(self, request, pk=None):
        sprint = self.get_object()
        tasks = Task.objects.filter(sprint=sprint)
        total = tasks.count()
        done = tasks.filter(status='done').count()
        return Response({
            'total_tasks': total,
            'completed': done,
            'remaining': total - done,
            'velocity': sprint.velocity,
        })


class MilestoneViewSet(viewsets.ModelViewSet):
    """Milestones - editors can manage, viewers read-only."""
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'status']

    def get_queryset(self):
        return Milestone.objects.filter(
            project__organization__members__user=self.request.user
        ).order_by('-created_at').distinct()


class TaskCommentViewSet(viewsets.ModelViewSet):
    """Task comments."""
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]

    def get_queryset(self):
        return TaskComment.objects.filter(
            task__project__organization__members__user=self.request.user
        ).order_by('-created_at').distinct()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class TaskAttachmentViewSet(viewsets.ModelViewSet):
    """Task attachments."""
    serializer_class = TaskAttachmentSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]

    def get_queryset(self):
        return TaskAttachment.objects.filter(
            task__project__organization__members__user=self.request.user
        ).order_by('-created_at').distinct()


class TaskViewSet(viewsets.ModelViewSet):
    """Tasks - editors can manage, viewers read-only."""
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project', 'status', 'priority', 'assignee', 'milestone']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority']

    def get_queryset(self):
        return Task.objects.filter(
            project__organization__members__user=self.request.user,
            project__organization__members__is_active=True
        ).select_related('project', 'assignee', 'reporter').prefetch_related('comments').order_by('-created_at').distinct()

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        valid = [s[0] for s in Task.STATUS]
        if new_status not in valid:
            return Response({'error': f'Valid statuses: {valid}'}, status=400)
        task.status = new_status
        if new_status == 'done':
            task.progress = 100
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        task = self.get_object()
        comment = TaskComment.objects.create(
            task=task,
            author=request.user,
            content=request.data.get('content', ''),
        )
        return Response(TaskCommentSerializer(comment).data, status=201)

    @action(detail=True, methods=['get'])
    def subtasks(self, request, pk=None):
        task = self.get_object()
        subtasks = Task.objects.filter(parent=task)
        return Response(TaskSerializer(subtasks, many=True).data)

    @action(detail=True, methods=['post'])
    def log_time(self, request, pk=None):
        task = self.get_object()
        hours = float(request.data.get('hours', 0))
        task.actual_hours += hours
        task.save()
        return Response({'actual_hours': float(task.actual_hours)})
