from rest_framework import serializers
from .models import Pipeline, Contact, Deal, Activity


class PipelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pipeline
        fields = '__all__'
        read_only_fields = ['organization', 'created_at']


class ContactSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = '__all__'
        read_only_fields = ['organization', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None


class DealSerializer(serializers.ModelSerializer):
    contact_name = serializers.SerializerMethodField()
    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = '__all__'
        read_only_fields = ['organization', 'created_at', 'updated_at']

    def get_contact_name(self, obj):
        return str(obj.contact) if obj.contact else None

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None


class ActivitySerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = '__all__'
        read_only_fields = ['organization', 'created_at']

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None
