from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Count, Q

from .models import JobPosting, Applicant, Interview, OfferLetter, InterviewScorecard
from .serializers import (JobPostingSerializer, ApplicantSerializer,
                           InterviewSerializer, OfferLetterSerializer, InterviewScorecardSerializer)
from apps.core.permissions import IsOrgEditorOrReadOnly, IsOrgAdmin


class JobPostingViewSet(viewsets.ModelViewSet):
    """Job postings - editors can manage, viewers read-only."""
    serializer_class = JobPostingSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'employment_type', 'department']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['created_at', 'posted_at']

    def get_queryset(self):
        return JobPosting.objects.filter(
            organization__members__user=self.request.user,
            organization__members__is_active=True
        ).annotate(applicant_count=Count('applicants')).order_by('-created_at').distinct()

    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        if not org:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("No active organization found.")
        serializer.save(organization=org, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        job = self.get_object()
        job.status = 'published'
        job.posted_at = timezone.now()
        job.save()
        return Response(JobPostingSerializer(job).data)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        job = self.get_object()
        job.status = 'closed'
        job.save()
        return Response(JobPostingSerializer(job).data)

    @action(detail=False, methods=['get'])
    def pipeline_stats(self, request):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        if not org:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("No active organization found.")
        stages = ['new', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected']
        stats = {}
        for stage in stages:
            stats[stage] = Applicant.objects.filter(job__organization=org, stage=stage).count()
        return Response({
            'by_stage': stats,
            'total_applicants': Applicant.objects.filter(job__organization=org).count(),
            'open_jobs': JobPosting.objects.filter(organization=org, status='published').count(),
        })


class ApplicantViewSet(viewsets.ModelViewSet):
    """Applicants - editors can manage, viewers read-only."""
    serializer_class = ApplicantSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['job', 'stage', 'source']
    search_fields = ['first_name', 'last_name', 'email', 'current_company']
    ordering_fields = ['applied_at', 'rating']

    def get_queryset(self):
        return Applicant.objects.filter(
            job__organization__members__user=self.request.user,
            job__organization__members__is_active=True
        ).select_related('job').order_by('-applied_at').distinct()

    @action(detail=True, methods=['post'])
    def move_stage(self, request, pk=None):
        applicant = self.get_object()
        new_stage = request.data.get('stage')
        valid_stages = [s[0] for s in Applicant.STAGE]
        if new_stage not in valid_stages:
            return Response({'error': f'Invalid stage. Valid: {valid_stages}'}, status=400)
        applicant.stage = new_stage
        applicant.save()
        return Response(ApplicantSerializer(applicant).data)

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        applicant = self.get_object()
        rating = request.data.get('rating')
        if rating not in range(1, 6):
            return Response({'error': 'Rating must be 1-5'}, status=400)
        applicant.rating = rating
        applicant.notes = request.data.get('notes', applicant.notes)
        applicant.save()
        return Response(ApplicantSerializer(applicant).data)


class InterviewViewSet(viewsets.ModelViewSet):
    """Interviews - editors can manage, viewers read-only."""
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['applicant', 'status', 'interview_type']
    ordering_fields = ['scheduled_at']

    def get_queryset(self):
        return Interview.objects.filter(
            applicant__job__organization__members__user=self.request.user
        ).select_related('applicant', 'interviewer').order_by('-created_at').distinct()

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        interview = self.get_object()
        interview.status = 'completed'
        interview.feedback = request.data.get('feedback', '')
        interview.score = request.data.get('score')
        interview.save()
        return Response(InterviewSerializer(interview).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        interview = self.get_object()
        interview.status = 'cancelled'
        interview.save()
        return Response(InterviewSerializer(interview).data)


class OfferLetterViewSet(viewsets.ModelViewSet):
    """Offer letters - admins can manage (sensitive financial data)."""
    serializer_class = OfferLetterSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        return OfferLetter.objects.filter(
            job__organization__members__user=self.request.user
        ).select_related('applicant', 'job').order_by('-created_at').distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOrgAdmin])
    def send(self, request, pk=None):
        """Only admins can send offer letters."""
        offer = self.get_object()
        offer.status = 'sent'
        offer.sent_at = timezone.now()
        offer.save()
        return Response(OfferLetterSerializer(offer).data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        offer = self.get_object()
        offer.status = 'accepted'
        offer.responded_at = timezone.now()
        offer.save()
        offer.applicant.stage = 'hired'
        offer.applicant.save()
        return Response(OfferLetterSerializer(offer).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        offer = self.get_object()
        offer.status = 'rejected'
        offer.responded_at = timezone.now()
        offer.rejection_reason = request.data.get('reason', '')
        offer.save()
        return Response(OfferLetterSerializer(offer).data)


class InterviewScorecardViewSet(viewsets.ModelViewSet):
    """Interview scorecards - editors can manage, viewers read-only."""
    serializer_class = InterviewScorecardSerializer
    permission_classes = [IsAuthenticated, IsOrgEditorOrReadOnly]

    def get_queryset(self):
        return InterviewScorecard.objects.filter(
            interview__applicant__job__organization__members__user=self.request.user
        ).order_by('-created_at').distinct()
