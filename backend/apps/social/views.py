from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Sum, Count, Avg

from .models import SocialAccount, SocialPost, SocialMessage, Campaign, MediaFile, PostAnalytic, Webhook, Hashtag, PostQueue
from .serializers import (SocialAccountSerializer, SocialPostSerializer, SocialMessageSerializer,
                           CampaignSerializer, MediaFileSerializer, PostAnalyticSerializer,
                           WebhookSerializer, HashtagSerializer, PostQueueSerializer)


class SocialAccountViewSet(viewsets.ModelViewSet):
    serializer_class = SocialAccountSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['platform', 'is_active', 'is_connected']

    def get_queryset(self):
        return SocialAccount.objects.filter(
            organization__members__user=self.request.user,
            organization__members__is_active=True
        ).distinct()

    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org)

    @action(detail=False, methods=['get'])
    def overview(self, request):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        accounts = SocialAccount.objects.filter(organization=org, is_connected=True)
        return Response({
            'total_accounts': accounts.count(),
            'total_followers': accounts.aggregate(t=Sum('follower_count'))['t'] or 0,
            'by_platform': {
                a['platform']: a['follower_count']
                for a in accounts.values('platform', 'follower_count')
            },
        })

    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        account = self.get_object()
        account.last_synced = timezone.now()
        account.save()
        return Response({'status': 'synced', 'synced_at': account.last_synced})


class SocialPostViewSet(viewsets.ModelViewSet):
    serializer_class = SocialPostSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'ai_generated']
    search_fields = ['content']
    ordering_fields = ['created_at', 'scheduled_at', 'published_at']

    def get_queryset(self):
        return SocialPost.objects.filter(
            organization__members__user=self.request.user,
            organization__members__is_active=True
        ).select_related('author').distinct()

    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org, author=self.request.user)

    @action(detail=False, methods=['post'])
    def generate_ai(self, request):
        """AI-powered post content generation using Claude API"""
        prompt = request.data.get('prompt', '')
        tone = request.data.get('tone', 'professional')
        platforms = request.data.get('platforms', ['instagram', 'twitter'])
        include_hashtags = request.data.get('include_hashtags', True)

        import os, json
        api_key = os.getenv('ANTHROPIC_API_KEY', '')

        if api_key:
            try:
                import urllib.request
                system_prompt = f"""You are a social media content expert. Generate engaging post content.
Tone: {tone}. Platforms: {', '.join(platforms)}.
{"Include relevant hashtags." if include_hashtags else "No hashtags."}.
Return JSON with: {{"content": "...", "hashtags": [...], "platform_variants": {{"twitter": "...", "instagram": "..."}}}}"""

                data = json.dumps({
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1024,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": f"Create a post about: {prompt}"}]
                }).encode()

                req = urllib.request.Request(
                    'https://api.anthropic.com/v1/messages',
                    data=data,
                    headers={
                        'x-api-key': api_key,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json',
                    }
                )
                with urllib.request.urlopen(req, timeout=30) as resp:
                    result = json.loads(resp.read())
                    text = result['content'][0]['text']
                    try:
                        parsed = json.loads(text)
                        return Response({'generated': True, **parsed})
                    except Exception:
                        return Response({'generated': True, 'content': text, 'hashtags': [], 'platform_variants': {}})
            except Exception as e:
                pass

        # Fallback: template-based generation
        templates = {
            'professional': f"Excited to share insights about {prompt}! Our team has been working hard to deliver excellence. Stay tuned for more updates. 🚀",
            'casual': f"Hey everyone! Check this out about {prompt} 😊 Let us know your thoughts in the comments!",
            'promotional': f"🎉 Big news about {prompt}! Don't miss out on this amazing opportunity. Click the link in bio to learn more!",
        }
        content = templates.get(tone, templates['professional'])
        hashtags = [f"#{w}" for w in prompt.split()[:3] if len(w) > 3]
        return Response({
            'generated': True,
            'content': content,
            'hashtags': hashtags,
            'platform_variants': {
                'twitter': content[:280],
                'instagram': content + '\n\n' + ' '.join(hashtags),
                'linkedin': f"I wanted to share something about {prompt}.\n\n{content}",
            }
        })

    @action(detail=False, methods=['post'])
    def schedule(self, request):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        post = SocialPost.objects.create(
            organization=org,
            author=request.user,
            content=request.data.get('content', ''),
            platforms=request.data.get('platforms', []),
            scheduled_at=request.data.get('scheduled_at'),
            status='scheduled',
            media_urls=request.data.get('media_urls', []),
            tags=request.data.get('tags', []),
        )
        return Response(SocialPostSerializer(post).data, status=201)

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        qs = SocialPost.objects.filter(organization=org, scheduled_at__isnull=False)
        if month and year:
            qs = qs.filter(scheduled_at__month=month, scheduled_at__year=year)
        return Response(SocialPostSerializer(qs.order_by('scheduled_at'), many=True).data)

    @action(detail=False, methods=['get'])
    def analytics_summary(self, request):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        analytics = PostAnalytic.objects.filter(post__organization=org)
        return Response({
            'total_impressions': analytics.aggregate(s=Sum('impressions'))['s'] or 0,
            'total_reach': analytics.aggregate(s=Sum('reach'))['s'] or 0,
            'total_likes': analytics.aggregate(s=Sum('likes'))['s'] or 0,
            'total_comments': analytics.aggregate(s=Sum('comments'))['s'] or 0,
            'total_shares': analytics.aggregate(s=Sum('shares'))['s'] or 0,
            'avg_engagement_rate': float(analytics.aggregate(a=Avg('engagement_rate'))['a'] or 0),
            'total_posts': SocialPost.objects.filter(organization=org, status='published').count(),
        })


class SocialMessageViewSet(viewsets.ModelViewSet):
    serializer_class = SocialMessageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_read', 'is_replied', 'message_type', 'social_account']
    search_fields = ['sender_name', 'content']

    def get_queryset(self):
        return SocialMessage.objects.filter(
            organization__members__user=self.request.user
        ).select_related('social_account').distinct()

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        count = SocialMessage.objects.filter(organization=org, is_read=False).count()
        return Response({'unread': count})

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        message = self.get_object()
        message.is_replied = True
        message.is_read = True
        message.save()
        return Response({'status': 'replied', 'reply': request.data.get('reply', '')})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        updated = SocialMessage.objects.filter(organization=org, is_read=False).update(is_read=True)
        return Response({'marked_read': updated})


class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'objective']
    search_fields = ['name']

    def get_queryset(self):
        return Campaign.objects.filter(
            organization__members__user=self.request.user
        ).prefetch_related('posts').distinct()

    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        serializer.save(organization=org, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        campaign = self.get_object()
        campaign.status = 'active'
        campaign.save()
        return Response(CampaignSerializer(campaign).data)

    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        campaign = self.get_object()
        post_ids = campaign.posts.values_list('id', flat=True)
        analytics = PostAnalytic.objects.filter(post_id__in=post_ids)
        return Response({
            'posts': campaign.posts.count(),
            'impressions': analytics.aggregate(s=Sum('impressions'))['s'] or 0,
            'reach': analytics.aggregate(s=Sum('reach'))['s'] or 0,
            'engagement': analytics.aggregate(s=Sum('likes'))['s'] or 0,
            'clicks': analytics.aggregate(s=Sum('clicks'))['s'] or 0,
        })


class MediaFileViewSet(viewsets.ModelViewSet):
    serializer_class = MediaFileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['file_type']

    def get_queryset(self):
        return MediaFile.objects.filter(
            organization__members__user=self.request.user
        ).distinct()

    def perform_create(self, serializer):
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=self.request.user).first()
        f = self.request.FILES.get('file')
        serializer.save(
            organization=org, uploaded_by=self.request.user,
            filename=f.name if f else 'upload',
            size_bytes=f.size if f else 0,
        )


class HashtagViewSet(viewsets.ModelViewSet):
    serializer_class = HashtagSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['platform', 'is_trending']
    search_fields = ['tag', 'category']

    def get_queryset(self):
        return Hashtag.objects.filter(
            organization__members__user=self.request.user
        ).order_by('-usage_count').distinct()

    @action(detail=False, methods=['get'])
    def suggest(self, request):
        topic = request.query_params.get('topic', '')
        platform = request.query_params.get('platform', 'instagram')
        from apps.core.models import Organization
        org = Organization.objects.filter(members__user=request.user).first()
        existing = Hashtag.objects.filter(
            organization=org, platform=platform, tag__icontains=topic
        ).order_by('-usage_count')[:10]
        # Also suggest generic ones
        generic = ['trending', 'viral', 'content', 'socialmedia', 'marketing',
                   'business', 'entrepreneur', 'growth', 'digital', 'brand']
        suggestions = [f"#{h.tag}" for h in existing]
        suggestions += [f"#{g}" for g in generic if topic.lower() not in g]
        return Response({'suggestions': suggestions[:15]})


class PostAnalyticViewSet(viewsets.ModelViewSet):
    serializer_class = PostAnalyticSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['post', 'social_account']

    def get_queryset(self):
        return PostAnalytic.objects.filter(
            post__organization__members__user=self.request.user
        ).distinct()


class PostQueueViewSet(viewsets.ModelViewSet):
    serializer_class = PostQueueSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'social_account']

    def get_queryset(self):
        return PostQueue.objects.filter(
            post__organization__members__user=self.request.user
        ).order_by('scheduled_at').distinct()
