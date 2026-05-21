from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PipelineViewSet, ContactViewSet, DealViewSet, ActivityViewSet

router = DefaultRouter()
router.register(r'pipelines', PipelineViewSet, basename='pipeline')
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'deals', DealViewSet, basename='deal')
router.register(r'activities', ActivityViewSet, basename='activity')

urlpatterns = [path('', include(router.urls))]
