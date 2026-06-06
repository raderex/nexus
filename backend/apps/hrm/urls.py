from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (DepartmentViewSet, EmployeeViewSet, PayrollViewSet, AttendanceViewSet,
                    LeaveTypeViewSet, LeaveBalanceViewSet, LeaveRequestViewSet, PerformanceGoalViewSet,
                    PerformanceReviewViewSet, AssetViewSet)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'leave-balances', LeaveBalanceViewSet, basename='leavebalance')
router.register(r'payrolls', PayrollViewSet, basename='payroll')
router.register(r'attendances', AttendanceViewSet, basename='attendance')
router.register(r'leave-types', LeaveTypeViewSet, basename='leavetype')
router.register(r'leave-requests', LeaveRequestViewSet, basename='leaverequest')
router.register(r'goals', PerformanceGoalViewSet, basename='goal')
router.register(r'reviews', PerformanceReviewViewSet, basename='review')
router.register(r'assets', AssetViewSet, basename='asset')

urlpatterns = [path('', include(router.urls))]
