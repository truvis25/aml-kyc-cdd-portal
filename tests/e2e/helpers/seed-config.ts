/**
 * E2E test seed configuration.
 *
 * Single source of truth for the predictable UUIDs / emails / passwords
 * created by the SQL seed in `supabase/seed.sql`. Both the seed SQL and
 * the Playwright tests reference these — keep them in sync if you ever
 * rotate an ID.
 *
 * Why we don't use env vars here: the seed values are fixed, identical
 * across every developer's local Supabase. Treating them as configuration
 * obscures that they are a coupled contract between SQL + tests.
 *
 * What's NOT seeded:
 *   - tenant_admin and mlro users — both require MFA per the proxy
 *     (MFA_REQUIRED_ROLES in proxy.ts). Bypassing MFA in the proxy for
 *     tests would be a backdoor; using the Supabase admin API to enrol
 *     a TOTP factor for these users at seed time is fragile and
 *     environment-specific. Deferred to a separate "seed v2" pass that
 *     either runs against a no-MFA Supabase project or wires up a
 *     test-only admin script that uses supabase.auth.admin.mfa.*.
 *
 * Local-dev-only credentials. Never reuse these passwords anywhere.
 */

export const TEST_TENANT = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'truvis-test',
  name: 'TruVis Test Tenant',
} as const;

export const TEST_PASSWORD = 'TestPass123!';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: 'analyst' | 'senior_reviewer' | 'onboarding_agent' | 'read_only';
  displayName: string;
}

export const TEST_USERS = {
  analyst: {
    id: 'e0000000-0000-0000-0000-000000000001',
    email: 'analyst@truvis-test.local',
    password: TEST_PASSWORD,
    role: 'analyst',
    displayName: 'Test Analyst',
  },
  senior_reviewer: {
    id: 'e0000000-0000-0000-0000-000000000002',
    email: 'sr@truvis-test.local',
    password: TEST_PASSWORD,
    role: 'senior_reviewer',
    displayName: 'Test Senior Reviewer',
  },
  onboarding_agent: {
    id: 'e0000000-0000-0000-0000-000000000003',
    email: 'agent@truvis-test.local',
    password: TEST_PASSWORD,
    role: 'onboarding_agent',
    displayName: 'Test Onboarding Agent',
  },
  read_only: {
    id: 'e0000000-0000-0000-0000-000000000004',
    email: 'readonly@truvis-test.local',
    password: TEST_PASSWORD,
    role: 'read_only',
    displayName: 'Test Read Only',
  },
} as const satisfies Record<string, TestUser>;

/** Fixture customer rows, with predictable IDs the e2e tests can assert against. */
export const TEST_CUSTOMERS = {
  /** Medium-risk individual customer, in_progress, used for analyst-flow tests. */
  medium_risk: {
    id: 'c0000000-0000-0000-0000-000000000001',
    full_name: 'Aisha Test Subject',
    nationality: 'AE',
    risk_band: 'medium',
  },
  /** High-risk individual, awaiting Senior Reviewer decision. */
  high_risk: {
    id: 'c0000000-0000-0000-0000-000000000002',
    full_name: 'Hamad Test Subject',
    nationality: 'AE',
    risk_band: 'high',
  },
} as const;

/**
 * Fixture cases. The IDs match the seed exactly — do not change one
 * without the other.
 */
export const TEST_CASES = {
  /** Assigned to the Analyst test user. */
  analyst_case: {
    id: 'ca000000-0000-0000-0000-000000000001',
    customer_id: TEST_CUSTOMERS.medium_risk.id,
    queue: 'standard',
    assigned_to_role: 'analyst',
  },
  /** Assigned to the Senior Reviewer test user, escalated from analyst. */
  sr_case: {
    id: 'ca000000-0000-0000-0000-000000000002',
    customer_id: TEST_CUSTOMERS.high_risk.id,
    queue: 'edd',
    assigned_to_role: 'senior_reviewer',
  },
} as const;
