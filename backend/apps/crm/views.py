from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count
from .models import Pipeline, Contact, Deal, Activity
from .serializers import PipelineSerializer, ContactSerializer, DealSerializer, ActivitySerializer
from apps.core.permissions import IsOrgEditorOrReadOnly, IsOrgAdmin


class PipelineViewSet(viewsets.ModelViewSet):
    """CRM Pipelines - admins can manage, editors/viewers read-only."""
    serializer_class = PipelineSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    def get_queryset(self):
        return Pipeline.objects.filter(organization__members__user=self.request.user).order_by('-created_at').distinct()
    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org)


class ContactViewSet(viewsets.ModelViewSet):
    """CRM Contacts - editors can manage, viewers read-only."""
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['type', 'status']
    search_fields = ['first_name', 'last_name', 'email', 'company']
    def get_queryset(self):
        return Contact.objects.filter(organization__members__user=self.request.user).order_by('-created_at').distinct()
    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org, created_by=self.request.user)


class DealViewSet(viewsets.ModelViewSet):
    """CRM Deals - editors can manage, viewers read-only."""
    serializer_class = DealSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'stage', 'pipeline']
    search_fields = ['title']
    def get_queryset(self):
        return Deal.objects.filter(organization__members__user=self.request.user).select_related('contact', 'pipeline').order_by('-created_at').distinct()
    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org, assigned_to=self.request.user)
    @action(detail=False, methods=['get'])
    def pipeline_summary(self, request):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        deals = Deal.objects.filter(organization=org)
        by_stage = {}
        for stage in ['new','qualified','proposal','negotiation','won','lost']:
            qs = deals.filter(stage=stage)
            by_stage[stage] = {
                'count': qs.count(),
                'value': float(qs.aggregate(s=Sum('value'))['s'] or 0),
            }
        return Response({
            'by_stage': by_stage,
            'total_open': float(deals.filter(status='open').aggregate(s=Sum('value'))['s'] or 0),
            'total_won': float(deals.filter(status='won').aggregate(s=Sum('value'))['s'] or 0),
        })


class ActivityViewSet(viewsets.ModelViewSet):
    """CRM Activities - editors can manage, viewers read-only."""
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['activity_type', 'status', 'contact', 'deal']
    def get_queryset(self):
        return Activity.objects.filter(organization__members__user=self.request.user).order_by('-created_at').distinct()
    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org, assigned_to=self.request.user)
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        from django.utils import timezone
        act = self.get_object()
        act.status = 'completed'
        act.completed_at = timezone.now()
        act.save()
        return Response(ActivitySerializer(act).data)
