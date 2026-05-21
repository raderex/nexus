"""
Nexus Role-Based Access Control (RBAC) Permissions.

Organization roles (OrganizationMember.role):
    - owner   : Full access, can delete org, manage billing
    - admin   : Full CRUD on all resources, manage members
    - editor  : Create, read, update resources (no delete, no member mgmt)
    - viewer  : Read-only access

User-level roles (User.role):
    - super_admin : Platform-wide super admin
    - admin       : Org admin
    - manager     : Department/team manager
    - employee    : Standard employee
    - viewer      : Read-only

Usage in views:
    permission_classes = [IsAuthenticated, IsOrgAdmin]
    permission_classes = [IsAuthenticated, IsOrgEditorOrAbove]
    permission_classes = [IsAuthenticated, IsOrgMember]
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS
from apps.core.models import OrganizationMember


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_org_role(user):
    """Return the highest-priority org membership role for the user."""
    ROLE_PRIORITY = {'owner': 0, 'admin': 1, 'editor': 2, 'viewer': 3}
    memberships = OrganizationMember.objects.filter(
        user=user, is_active=True
    ).values_list('role', flat=True)
    if not memberships:
        return None
    return min(memberships, key=lambda r: ROLE_PRIORITY.get(r, 99))


def _user_has_org_role(user, allowed_roles):
    """Check if the user holds any of the allowed org-level roles."""
    return OrganizationMember.objects.filter(
        user=user,
        is_active=True,
        role__in=allowed_roles,
    ).exists()


# ---------------------------------------------------------------------------
# Organization-Level Permissions
# ---------------------------------------------------------------------------

class IsOrgOwner(BasePermission):
    """Only organization owners."""
    message = 'Only organization owners can perform this action.'

    def has_permission(self, request, view):
        return _user_has_org_role(request.user, ['owner'])


class IsOrgAdmin(BasePermission):
    """Organization owners or admins."""
    message = 'Only organization admins can perform this action.'

    def has_permission(self, request, view):
        return _user_has_org_role(request.user, ['owner', 'admin'])


class IsOrgEditorOrAbove(BasePermission):
    """Organization owners, admins, or editors. Viewers are denied."""
    message = 'You do not have editor-level access.'

    def has_permission(self, request, view):
        return _user_has_org_role(request.user, ['owner', 'admin', 'editor'])


class IsOrgMember(BasePermission):
    """Any active organization member (including viewers)."""
    message = 'You must be a member of an organization.'

    def has_permission(self, request, view):
        return OrganizationMember.objects.filter(
            user=request.user, is_active=True
        ).exists()


# ---------------------------------------------------------------------------
# Read/Write Split Permissions
# ---------------------------------------------------------------------------

class IsOrgAdminOrReadOnly(BasePermission):
    """
    Admins/owners can do anything.
    Editors and viewers get read-only access.
    """
    message = 'Admin access required for write operations.'

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return OrganizationMember.objects.filter(
                user=request.user, is_active=True
            ).exists()
        return _user_has_org_role(request.user, ['owner', 'admin'])


class IsOrgEditorOrReadOnly(BasePermission):
    """
    Editors and above can create/update.
    Viewers get read-only access.
    Delete restricted to admin/owner.
    """
    message = 'Editor access required for write operations.'

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return OrganizationMember.objects.filter(
                user=request.user, is_active=True
            ).exists()
        if request.method == 'DELETE':
            return _user_has_org_role(request.user, ['owner', 'admin'])
        return _user_has_org_role(request.user, ['owner', 'admin', 'editor'])


# ---------------------------------------------------------------------------
# User-Level Role Permissions
# ---------------------------------------------------------------------------

class IsSuperAdmin(BasePermission):
    """Platform-level super admin."""
    message = 'Super admin access required.'

    def has_permission(self, request, view):
        return request.user.role == 'super_admin'


class IsManagerOrAbove(BasePermission):
    """User role must be manager, admin, or super_admin."""
    message = 'Manager-level access required.'

    def has_permission(self, request, view):
        return request.user.role in ('super_admin', 'admin', 'manager')


# ---------------------------------------------------------------------------
# Object-Level Permissions
# ---------------------------------------------------------------------------

class IsOwnerOrReadOnly(BasePermission):
    """
    Object-level permission: only the creator/owner of an object can modify it.
    Expects the object to have a `created_by` or `author` or `user` field.
    """
    message = 'You can only modify your own resources.'

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        # Check common owner-field patterns
        for attr in ('created_by', 'author', 'user', 'assigned_to', 'reporter'):
            owner = getattr(obj, attr, None)
            if owner is not None:
                return owner == request.user
        # If no owner field found, fall back to org role check
        return _user_has_org_role(request.user, ['owner', 'admin'])
