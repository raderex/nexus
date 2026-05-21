from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Organization, OrganizationMember

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name',
                  'avatar', 'phone', 'role', 'is_active', 'last_activity', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'phone', 'role']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class OrganizationSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = '__all__'

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()


class OrganizationMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = OrganizationMember
        fields = '__all__'
