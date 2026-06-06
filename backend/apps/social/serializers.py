from rest_framework import serializers
from .models import SocialAccount, SocialPost, SocialMessage, Campaign, MediaFile, PostAnalytic, Webhook, Hashtag, PostQueue


class SocialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialAccount
        fields = ['id', 'platform', 'account_name', 'account_handle', 'follower_count',
                  'is_active', 'is_connected', 'last_synced', 'profile_url', 'profile_image']


class SocialPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    class Meta:
        model = SocialPost
        fields = '__all__'
        read_only_fields = ['organization', 'created_at', 'updated_at']


class SocialMessageSerializer(serializers.ModelSerializer):
    platform = serializers.CharField(source='social_account.platform', read_only=True)
    account_name = serializers.CharField(source='social_account.account_name', read_only=True)
    class Meta:
        model = SocialMessage
        fields = '__all__'


class CampaignSerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    class Meta:
        model = Campaign
        fields = '__all__'
        read_only_fields = ['organization', 'created_at', 'updated_at']
    def get_post_count(self, obj):
        return obj.posts.count()


class MediaFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaFile
        fields = '__all__'
        read_only_fields = ['organization', 'created_at']


class PostAnalyticSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostAnalytic
        fields = '__all__'
        read_only_fields = ['created_at']


class WebhookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Webhook
        fields = '__all__'
        read_only_fields = ['organization', 'created_at']


class HashtagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hashtag
        fields = '__all__'


class PostQueueSerializer(serializers.ModelSerializer):
    post_content = serializers.CharField(source='post.content', read_only=True)
    platform = serializers.CharField(source='social_account.platform', read_only=True)
    class Meta:
        model = PostQueue
        fields = '__all__'
        read_only_fields = ['created_at']
