from rest_framework import serializers
from .models import (Department, Employee, Payroll, Attendance,
                     LeaveType, LeaveBalance, LeaveRequest,
                     PerformanceGoal, PerformanceReview, Asset)
from apps.core.serializers import UserSerializer


class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()
    class Meta:
        model = Department
        fields = '__all__'
    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()
    def get_manager_name(self, obj):
        return obj.manager.get_full_name() if obj.manager else None


class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    department_name = serializers.CharField(source='department.name', read_only=True)
    full_name = serializers.SerializerMethodField()
    class Meta:
        model = Employee
        fields = '__all__'
    def get_full_name(self, obj):
        return obj.user.get_full_name()


class PayrollSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    class Meta:
        model = Payroll
        fields = '__all__'
    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    class Meta:
        model = Attendance
        fields = '__all__'
    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'


class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    leave_type_color = serializers.CharField(source='leave_type.color', read_only=True)
    available = serializers.ReadOnlyField()
    class Meta:
        model = LeaveBalance
        fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    leave_type_color = serializers.CharField(source='leave_type.color', read_only=True)
    reviewer_name = serializers.SerializerMethodField()
    class Meta:
        model = LeaveRequest
        fields = '__all__'
    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()
    def get_reviewer_name(self, obj):
        return obj.reviewed_by.get_full_name() if obj.reviewed_by else None


class PerformanceGoalSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    class Meta:
        model = PerformanceGoal
        fields = '__all__'
    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()


class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    reviewer_name = serializers.SerializerMethodField()
    class Meta:
        model = PerformanceReview
        fields = '__all__'
    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name()
    def get_reviewer_name(self, obj):
        return obj.reviewer.get_full_name() if obj.reviewer else None


class AssetSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    class Meta:
        model = Asset
        fields = '__all__'
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.user.get_full_name() if obj.assigned_to else None
