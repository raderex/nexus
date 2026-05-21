from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobPostingViewSet, ApplicantViewSet, InterviewViewSet, OfferLetterViewSet, InterviewScorecardViewSet

router = DefaultRouter()
router.register(r'jobs', JobPostingViewSet, basename='job')
router.register(r'applicants', ApplicantViewSet, basename='applicant')
router.register(r'interviews', InterviewViewSet, basename='interview')
router.register(r'offers', OfferLetterViewSet, basename='offer')
router.register(r'scorecards', InterviewScorecardViewSet, basename='scorecard')

urlpatterns = [path('', include(router.urls))]
