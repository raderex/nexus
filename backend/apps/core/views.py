from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from django.utils import timezone

from .models import Organization, User, OrganizationMember
from .serializers import OrganizationSerializer, UserSerializer, UserCreateSerializer, OrganizationMemberSerializer
from .permissions import IsOrgAdmin, IsOrgMember, IsOrgEditorOrReadOnly


class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated, IsOrgMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'email']

    def get_queryset(self):
        return Organization.objects.filter(members__user=self.request.user, members__is_active=True)

    def get_permissions(self):
        if self.action in ('create',):
            # Any authenticated user can create an org
            return [IsAuthenticated()]
        if self.action in ('destroy',):
            # Only org admins can delete
            return [IsAuthenticated(), IsOrgAdmin()]
        if self.action in ('update', 'partial_update'):
            # Only org admins can update org settings
            return [IsAuthenticated(), IsOrgAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=['get'])
    def dashboard_stats(self, request, pk=None):
        org = self.get_object()
        from apps.hrm.models import Employee
        from apps.crm.models import Contact, Deal
        from apps.pm.models import Project, Task
        from apps.social.models import SocialPost, SocialMessage
        from apps.erp.models import Income, Expense

        stats = {
            'total_employees': Employee.objects.filter(organization=org, is_active=True).count(),
            'total_contacts': Contact.objects.filter(organization=org, status='active').count(),
            'total_projects': Project.objects.filter(organization=org, status='active').count(),
            'total_deals': Deal.objects.filter(organization=org, status='open').count(),
            'total_income': Income.objects.filter(organization=org).aggregate(Sum('amount'))['amount__sum'] or 0,
            'total_expenses': Expense.objects.filter(organization=org, status='approved').aggregate(Sum('amount'))['amount__sum'] or 0,
            'open_tasks': Task.objects.filter(project__organization=org, status__in=['todo', 'in_progress', 'review']).count(),
            'scheduled_posts': SocialPost.objects.filter(organization=org, status='scheduled').count(),
            'unread_messages': SocialMessage.objects.filter(organization=org, is_read=False).count(),
        }
        return Response(stats)

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        org = self.get_object()
        members = OrganizationMember.objects.filter(organization=org, is_active=True).select_related('user')
        return Response(OrganizationMemberSerializer(members, many=True).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOrgAdmin])
    def invite_member(self, request, pk=None):
        """Only org admins/owners can invite members."""
        org = self.get_object()
        email = request.data.get('email')
        role = request.data.get('role', 'viewer')
        # Prevent non-owners from assigning the owner role
        if role == 'owner':
            member = OrganizationMember.objects.filter(
                organization=org, user=request.user, role='owner'
            ).first()
            if not member:
                return Response(
                    {'error': 'Only owners can assign the owner role'},
                    status=status.HTTP_403_FORBIDDEN
                )
        try:
            user = User.objects.get(email=email)
            member, created = OrganizationMember.objects.get_or_create(
                organization=org, user=user,
                defaults={'role': role, 'is_active': True}
            )
            return Response({'status': 'invited', 'created': created})
        except User.DoesNotExist:
            return Response({'error': 'User with this email not found'}, status=400)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOrgAdmin])
    def remove_member(self, request, pk=None):
        """Only org admins/owners can remove members."""
        org = self.get_object()
        user_id = request.data.get('user_id')
        try:
            member = OrganizationMember.objects.get(organization=org, user_id=user_id)
            # Prevent removing the last owner
            if member.role == 'owner':
                owner_count = OrganizationMember.objects.filter(
                    organization=org, role='owner', is_active=True
                ).count()
                if owner_count <= 1:
                    return Response(
                        {'error': 'Cannot remove the last owner'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            member.is_active = False
            member.save()
            return Response({'status': 'removed'})
        except OrganizationMember.DoesNotExist:
            return Response({'error': 'Member not found'}, status=404)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOrgAdmin])
    def change_member_role(self, request, pk=None):
        """Only org admins/owners can change member roles."""
        org = self.get_object()
        user_id = request.data.get('user_id')
        new_role = request.data.get('role')
        valid_roles = ['owner', 'admin', 'editor', 'viewer']
        if new_role not in valid_roles:
            return Response({'error': f'Valid roles: {valid_roles}'}, status=400)
        # Only owners can assign owner role
        if new_role == 'owner':
            is_owner = OrganizationMember.objects.filter(
                organization=org, user=request.user, role='owner'
            ).exists()
            if not is_owner:
                return Response({'error': 'Only owners can assign the owner role'}, status=403)
        try:
            member = OrganizationMember.objects.get(organization=org, user_id=user_id, is_active=True)
            member.role = new_role
            member.save()
            return Response({'status': 'role updated', 'new_role': new_role})
        except OrganizationMember.DoesNotExist:
            return Response({'error': 'Member not found'}, status=404)


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOrgMember]

    def get_queryset(self):
        return User.objects.filter(
            org_memberships__organization__members__user=self.request.user,
            org_memberships__is_active=True
        ).distinct()

    def get_permissions(self):
        if self.action in ('create', 'destroy'):
            return [IsAuthenticated(), IsOrgAdmin()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Users can always view/update their own profile."""
        if request.method == 'GET':
            return Response(UserSerializer(request.user).data)
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        user = request.user
        if not user.check_password(request.data.get('old_password', '')):
            return Response({'error': 'Wrong password'}, status=400)
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, status=400)
        user.set_password(new_password)
        user.save()
        return Response({'status': 'password changed'})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        org_data = request.data.get('organization', {})
        if org_data:
            from django.utils.text import slugify
            org = Organization.objects.create(
                name=org_data.get('name', f"{user.first_name}'s Org"),
                slug=slugify(org_data.get('name', user.username)) + f"-{user.id.hex[:6]}",
                email=user.email,
            )
            OrganizationMember.objects.create(organization=org, user=user, role='owner')
        return Response(UserSerializer(user).data, status=201)
