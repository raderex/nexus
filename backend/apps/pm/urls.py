from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, SprintViewSet, MilestoneViewSet, TaskViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'sprints', SprintViewSet, basename='sprint')
router.register(r'milestones', MilestoneViewSet, basename='milestone')
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [path('', include(router.urls))]
