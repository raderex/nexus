from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.core.views import RegisterView, HealthCheckView, AuthTokenView, AuthTokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', AuthTokenView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', AuthTokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/health/', HealthCheckView.as_view(), name='health-check'),
    path('api/', include('apps.core.urls')),
    path('api/erp/', include('apps.erp.urls')),
    path('api/crm/', include('apps.crm.urls')),
    path('api/hrm/', include('apps.hrm.urls')),
    path('api/ats/', include('apps.ats.urls')),
    path('api/pm/', include('apps.pm.urls')),
    path('api/tracking/', include('apps.tracking.urls')),
    path('api/social/', include('apps.social.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
