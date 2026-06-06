from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (TimeLogViewSet, TimeLogApprovalViewSet, ActivityLogViewSet,
                    ScreenshotViewSet, ProductivityMetricViewSet, AppUsageViewSet)

router = DefaultRouter()
router.register(r'time-logs', TimeLogViewSet, basename='timelog')
router.register(r'approvals', TimeLogApprovalViewSet, basename='timelog-approval')
router.register(r'activity', ActivityLogViewSet, basename='activity')
router.register(r'screenshots', ScreenshotViewSet, basename='screenshot')
router.register(r'productivity', ProductivityMetricViewSet, basename='productivity')
router.register(r'app-usage', AppUsageViewSet, basename='appusage')

urlpatterns = [path('', include(router.urls))]
