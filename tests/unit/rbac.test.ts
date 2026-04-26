import { describe, it, expect } from 'vitest';
import { hasPermission, hasAnyPermission, hasAllPermissions, PermissionDeniedError, assertPermission } from '@/modules/auth/rbac';
import { Role } from '@/lib/constants/roles';

describe('RBAC — hasPermission', () => {
  // Analyst permissions
  describe('Analyst role', () => {
    it('can add_note to assigned cases', () => {
      expect(hasPermission(Role.ANALYST, 'cases:add_note')).toBe(true);
    });

    it('can request_additional_info', () => {
      expect(hasPermission(Role.ANALYST, 'cases:request_additional_info')).toBe(true);
    });

    it('CANNOT approve_standard cases', () => {
      expect(hasPermission(Role.ANALYST, 'cases:approve_standard')).toBe(false);
    });

    it('CANNOT approve_high_risk cases', () => {
      expect(hasPermission(Role.ANALYST, 'cases:approve_high_risk')).toBe(false);
    });

    it('CANNOT reject cases', () => {
      expect(hasPermission(Role.ANALYST, 'cases:reject')).toBe(false);
    });

    it('CANNOT view_sar_status', () => {
      expect(hasPermission(Role.ANALYST, 'cases:view_sar_status')).toBe(false);
    });

    it('CANNOT manage users', () => {
      expect(hasPermission(Role.ANALYST, 'admin:manage_users')).toBe(false);
    });

    it('CANNOT read EDD data', () => {
      expect(hasPermission(Role.ANALYST, 'customers:read_edd_data')).toBe(false);
    });

    it('CANNOT configure risk', () => {
      expect(hasPermission(Role.ANALYST, 'risk:configure')).toBe(false);
    });
  });

  // Senior Reviewer permissions
  describe('Senior Reviewer role', () => {
    it('can approve standard cases', () => {
      expect(hasPermission(Role.SENIOR_REVIEWER, 'cases:approve_standard')).toBe(true);
    });

    it('can reject cases', () => {
      expect(hasPermission(Role.SENIOR_REVIEWER, 'cases:reject')).toBe(true);
    });

    it('can assign cases', () => {
      expect(hasPermission(Role.SENIOR_REVIEWER, 'cases:assign')).toBe(true);
    });

    it('can verify documents', () => {
      expect(hasPermission(Role.SENIOR_REVIEWER, 'documents:verify')).toBe(true);
    });

    it('can resolve screening hits', () => {
      expect(hasPermission(Role.SENIOR_REVIEWER, 'screening:resolve_hit')).toBe(true);
    });

    it('can read EDD data', () => {
      expect(hasPermission(Role.SENIOR_REVIEWER, 'customers:read_edd_data')).toBe(true);
    });

    it('CANNOT approve high-risk cases', () => {
      expect(hasPermission(Role.SENIOR_REVIEWER, 'cases:approve_high_risk')).toBe(false);
    });

    it('CANNOT view SAR status', () => {
      expect(hasPermission(Role.SENIOR_REVIEWER, 'cases:view_sar_status')).toBe(false);
    });

    it('CANNOT flag SAR', () => {
      expect(hasPermission(Role.SENIOR_REVIEWER, 'cases:flag_sar')).toBe(false);
    });

    it('CANNOT manage users', () => {
      expect(hasPermission(Role.SENIOR_REVIEWER, 'admin:manage_users')).toBe(false);
    });

    it('only reads assigned cases (not all)', () => {
      expect(hasPermission(Role.SENIOR_REVIEWER, 'cases:read_assigned')).toBe(true);
      expect(hasPermission(Role.SENIOR_REVIEWER, 'cases:read_all')).toBe(false);
    });
  });

  // MLRO permissions
  describe('MLRO role', () => {
    it('can view_sar_status', () => {
      expect(hasPermission(Role.MLRO, 'cases:view_sar_status')).toBe(true);
    });

    it('can approve_high_risk cases', () => {
      expect(hasPermission(Role.MLRO, 'cases:approve_high_risk')).toBe(true);
    });

    it('can read_edd_data', () => {
      expect(hasPermission(Role.MLRO, 'customers:read_edd_data')).toBe(true);
    });

    it('can configure risk', () => {
      expect(hasPermission(Role.MLRO, 'risk:configure')).toBe(true);
    });

    it('can export audit', () => {
      expect(hasPermission(Role.MLRO, 'audit:export')).toBe(true);
    });
  });

  // Tenant Admin permissions
  describe('Tenant Admin role', () => {
    it('can manage users', () => {
      expect(hasPermission(Role.TENANT_ADMIN, 'admin:manage_users')).toBe(true);
    });

    it('can manage config', () => {
      expect(hasPermission(Role.TENANT_ADMIN, 'admin:manage_config')).toBe(true);
    });

    it('can activate workflows', () => {
      expect(hasPermission(Role.TENANT_ADMIN, 'admin:activate_workflow')).toBe(true);
    });

    it('can view SAR status', () => {
      expect(hasPermission(Role.TENANT_ADMIN, 'cases:view_sar_status')).toBe(true);
    });

    it('can flag SAR', () => {
      expect(hasPermission(Role.TENANT_ADMIN, 'cases:flag_sar')).toBe(true);
    });

    it('can approve cases', () => {
      expect(hasPermission(Role.TENANT_ADMIN, 'cases:approve_standard')).toBe(true);
    });

    it('can verify documents', () => {
      expect(hasPermission(Role.TENANT_ADMIN, 'documents:verify')).toBe(true);
    });
  });

  // Read-only permissions
  describe('Read Only role', () => {
    it('can read aggregate reports', () => {
      expect(hasPermission(Role.READ_ONLY, 'reporting:read_aggregate')).toBe(true);
    });

    it('CANNOT read cases', () => {
      expect(hasPermission(Role.READ_ONLY, 'cases:read_all')).toBe(false);
    });

    it('CANNOT manage users', () => {
      expect(hasPermission(Role.READ_ONLY, 'admin:manage_users')).toBe(false);
    });
  });

  // Onboarding Agent permissions
  describe('Onboarding Agent role', () => {
    it('can initiate onboarding', () => {
      expect(hasPermission(Role.ONBOARDING_AGENT, 'onboarding:initiate')).toBe(true);
    });

    it('can upload documents', () => {
      expect(hasPermission(Role.ONBOARDING_AGENT, 'documents:upload')).toBe(true);
    });

    it('CANNOT read cases', () => {
      expect(hasPermission(Role.ONBOARDING_AGENT, 'cases:read_assigned')).toBe(false);
    });

    it('CANNOT approve cases', () => {
      expect(hasPermission(Role.ONBOARDING_AGENT, 'cases:approve_standard')).toBe(false);
    });
  });

  // Platform Super Admin
  describe('Platform Super Admin role', () => {
    it('can view all tenants', () => {
      expect(hasPermission(Role.PLATFORM_SUPER_ADMIN, 'admin:view_all_tenants')).toBe(true);
    });

    it('CANNOT read customer PII (no customer:read permissions)', () => {
      expect(hasPermission(Role.PLATFORM_SUPER_ADMIN, 'customers:read_all')).toBe(false);
    });

    it('CANNOT make compliance decisions', () => {
      expect(hasPermission(Role.PLATFORM_SUPER_ADMIN, 'cases:approve_standard')).toBe(false);
    });
  });
});

describe('RBAC — hasAnyPermission', () => {
  it('returns true if role has at least one of the permissions', () => {
    expect(
      hasAnyPermission(Role.ANALYST, ['cases:view_sar_status', 'cases:read_assigned'])
    ).toBe(true);
  });

  it('returns false if role has none of the permissions', () => {
    expect(
      hasAnyPermission(Role.ANALYST, ['cases:view_sar_status', 'cases:approve_high_risk'])
    ).toBe(false);
  });
});

describe('RBAC — hasAllPermissions', () => {
  it('returns true if role has all permissions', () => {
    expect(
      hasAllPermissions(Role.MLRO, ['cases:view_sar_status', 'cases:approve_high_risk'])
    ).toBe(true);
  });

  it('returns false if role is missing any permission', () => {
    expect(
      hasAllPermissions(Role.ANALYST, ['cases:read_assigned', 'cases:view_sar_status'])
    ).toBe(false);
  });
});

describe('RBAC — assertPermission', () => {
  it('does not throw when permission is granted', () => {
    expect(() => assertPermission(Role.MLRO, 'cases:view_sar_status')).not.toThrow();
  });

  it('throws PermissionDeniedError when permission is denied', () => {
    expect(() => assertPermission(Role.ANALYST, 'cases:view_sar_status')).toThrow(
      PermissionDeniedError
    );
  });

  it('throws PermissionDeniedError when role is undefined', () => {
    expect(() => assertPermission(undefined, 'cases:read_all')).toThrow(PermissionDeniedError);
  });
});
