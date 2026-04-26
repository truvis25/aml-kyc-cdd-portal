/**
 * RBAC — Role-Based Access Control
 * Source of truth: DevPlan v1.0 Section 4.2 RBAC Model + PRD v1.0 Section 5.3
 *
 * Permission checks are performed at two layers:
 * 1. Database (RLS) — enforces tenant isolation
 * 2. Application (this module) — enforces role-level permissions
 *
 * Both layers must agree. This module is the single source of truth for
 * what each role is permitted to do in the application layer.
 */

import { Role } from '@/lib/constants/roles';

// All definable permissions in the platform
export type Permission =
  // Case permissions
  | 'cases:read_assigned'
  | 'cases:read_all'
  | 'cases:read_high_risk'
  | 'cases:add_note'
  | 'cases:request_additional_info'
  | 'cases:escalate'
  | 'cases:approve_standard'
  | 'cases:approve_high_risk'
  | 'cases:reject'
  | 'cases:view_sar_status'
  | 'cases:flag_sar'
  | 'cases:assign'
  // Customer permissions
  | 'customers:read_assigned'
  | 'customers:read_all'
  | 'customers:read_edd_data'
  // Document permissions
  | 'documents:read'
  | 'documents:upload'
  | 'documents:verify'
  // Screening permissions
  | 'screening:read'
  | 'screening:resolve_hit'
  // Risk permissions
  | 'risk:read'
  | 'risk:configure'
  // Audit permissions
  | 'audit:read'
  | 'audit:export'
  // Admin permissions
  | 'admin:manage_users'
  | 'admin:manage_config'
  | 'admin:activate_workflow'
  | 'admin:view_all_tenants'
  // Onboarding permissions
  | 'onboarding:create'
  | 'onboarding:read'
  | 'onboarding:write'
  | 'onboarding:initiate'    // legacy alias — kept for compatibility
  | 'onboarding:assist_customer' // legacy alias — kept for compatibility
  // Reporting permissions
  | 'reporting:read_aggregate';

// Permission map per role
// Keys: Role — Values: set of granted permissions
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.PLATFORM_SUPER_ADMIN]: [
    'admin:view_all_tenants',
    'admin:manage_config',
    'audit:read',
    'audit:export',
    // Platform super-admin cannot read individual customer PII
    // Cannot make compliance decisions
  ],

  [Role.TENANT_ADMIN]: [
    'admin:manage_users',
    'admin:manage_config',
    'admin:activate_workflow',
    'onboarding:create',
    'onboarding:read',
    'onboarding:write',
    'cases:read_all',
    'cases:add_note',
    'cases:request_additional_info',
    'cases:escalate',
    'cases:approve_standard',
    'cases:approve_high_risk',
    'cases:reject',
    'cases:view_sar_status',
    'cases:flag_sar',
    'cases:assign',
    'customers:read_all',
    'customers:read_edd_data',
    'documents:read',
    'documents:upload',
    'documents:verify',
    'screening:read',
    'screening:resolve_hit',
    'risk:read',
    'audit:read',
    'audit:export',
    'reporting:read_aggregate',
  ],

  [Role.MLRO]: [
    'cases:read_all',
    'cases:read_high_risk',
    'cases:add_note',
    'cases:request_additional_info',
    'cases:escalate',
    'cases:approve_standard',
    'cases:approve_high_risk',
    'cases:reject',
    'cases:view_sar_status',
    'cases:flag_sar',
    'cases:assign',
    'customers:read_all',
    'customers:read_edd_data',
    'documents:read',
    'documents:verify',
    'screening:read',
    'screening:resolve_hit',
    'risk:read',
    'risk:configure',
    'audit:read',
    'audit:export',
    'reporting:read_aggregate',
  ],

  [Role.SENIOR_REVIEWER]: [
    'cases:read_assigned',
    'cases:add_note',
    'cases:request_additional_info',
    'cases:escalate',
    // Senior reviewer CANNOT view SAR status
    'customers:read_assigned',
    'customers:read_edd_data',
    'documents:read',
    'documents:verify',
    'screening:read',
    'screening:resolve_hit',
    'risk:read',
    'reporting:read_aggregate',
  ],

  [Role.ANALYST]: [
    'cases:read_assigned',
    'cases:add_note',
    'cases:request_additional_info',
    'cases:escalate',
    // Analyst cannot record final approval decisions
    // Analyst CANNOT view SAR status
    'customers:read_assigned',
    // Analyst CANNOT read EDD data
    'documents:read',
    'documents:verify',
    'screening:read',
    'screening:resolve_hit',
    'risk:read',
  ],

  [Role.ONBOARDING_AGENT]: [
    'onboarding:create',
    'onboarding:read',
    'onboarding:write',
    'onboarding:initiate',
    'onboarding:assist_customer',
    'documents:read',
    'documents:upload',
    // Onboarding agent CANNOT view EDD data
    // Onboarding agent CANNOT make compliance decisions
  ],

  [Role.READ_ONLY]: [
    'reporting:read_aggregate',
    // Read-only CANNOT access individual customer PII
    // Read-only CANNOT access case details
  ],
};

/**
 * Check if a role has a specific permission.
 * This is the primary permission check used in API routes and UI components.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role.
 */
export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Assert that a role has a permission, throwing if not.
 * Use in API routes to enforce access control.
 */
export function assertPermission(role: Role | undefined, permission: Permission): void {
  if (!role || !hasPermission(role, permission)) {
    throw new PermissionDeniedError(role, permission);
  }
}

export class PermissionDeniedError extends Error {
  readonly role: Role | undefined;
  readonly permission: Permission;

  constructor(role: Role | undefined, permission: Permission) {
    super(`Permission denied: role '${role ?? 'unknown'}' lacks '${permission}'`);
    this.name = 'PermissionDeniedError';
    this.role = role;
    this.permission = permission;
  }
}
