// Canonical list of platform roles
// Source of truth: DevPlan v1.0 Section 4.2 RBAC Model
export enum Role {
  PLATFORM_SUPER_ADMIN = 'platform_super_admin',
  TENANT_ADMIN = 'tenant_admin',
  MLRO = 'mlro',
  SENIOR_REVIEWER = 'senior_reviewer',
  ANALYST = 'analyst',
  ONBOARDING_AGENT = 'onboarding_agent',
  READ_ONLY = 'read_only',
}

// Roles that require MFA — enforced in middleware
export const MFA_REQUIRED_ROLES: Role[] = [
  Role.PLATFORM_SUPER_ADMIN,
  Role.TENANT_ADMIN,
  Role.MLRO,
];

// Roles that can access the platform (authenticated app)
export const PLATFORM_ROLES: Role[] = [
  Role.PLATFORM_SUPER_ADMIN,
  Role.TENANT_ADMIN,
  Role.MLRO,
  Role.SENIOR_REVIEWER,
  Role.ANALYST,
  Role.ONBOARDING_AGENT,
  Role.READ_ONLY,
];

// Roles assignable by a tenant-scoped admin.
export const TENANT_ADMIN_ASSIGNABLE_ROLES: Role[] = [
  Role.TENANT_ADMIN,
  Role.MLRO,
  Role.SENIOR_REVIEWER,
  Role.ANALYST,
  Role.ONBOARDING_AGENT,
  Role.READ_ONLY,
];

export function canManageCrossTenantUsers(role: Role): boolean {
  return role === Role.PLATFORM_SUPER_ADMIN;
}
