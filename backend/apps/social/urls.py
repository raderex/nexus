from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (SocialAccountViewSet, SocialPostViewSet, SocialMessageViewSet,
                    CampaignViewSet, MediaFileViewSet, HashtagViewSet,
                    PostAnalyticViewSet, PostQueueViewSet, WebhookViewSet)

router = DefaultRouter()
router.register(r'accounts', SocialAccountViewSet, basename='socialaccount')
router.register(r'posts', SocialPostViewSet, basename='socialpost')
router.register(r'messages', SocialMessageViewSet, basename='socialmessage')
router.register(r'campaigns', CampaignViewSet, basename='campaign')
router.register(r'media', MediaFileViewSet, basename='media')
router.register(r'hashtags', HashtagViewSet, basename='hashtag')
router.register(r'analytics', PostAnalyticViewSet, basename='postanalytic')
router.register(r'queue', PostQueueViewSet, basename='postqueue')
router.register(r'webhooks', WebhookViewSet, basename='webhook')

urlpatterns = [path('', include(router.urls))]
