/**
 * Tenant configuration shape. Stored as JSONB in `tenant_config.config` and
 * versioned per change. Forward-compatible: unknown keys are preserved when
 * a new config version is written.
 *
 * Default thresholds match ROLES_DASHBOARDS_FLOWS.md §4.
 */
export interface TenantConfig {
  modules: {
    /** Whether the tenant offers individual KYC onboarding. */
    individual_kyc: boolean;
    /** Whether the tenant offers corporate KYB onboarding. */
    corporate_kyb: boolean;
    /** Whether enhanced due diligence flow is enabled. */
    edd_enabled: boolean;
    /** Whether ongoing screening monitoring is enabled (Phase 2). */
    ongoing_screening: boolean;
  };
  documents: {
    /** Required document types for individual KYC. Order is preferred display order. */
    required_individual: string[];
    /** Required document types for corporate KYB. */
    required_corporate: string[];
  };
  /** Read-only in MVP; surfaces the band cutoffs from the risk engine. */
  risk_thresholds: {
    medium: number;   // ≤ medium → 'medium' band
    high: number;     // ≤ high → 'high' band
    unacceptable: number; // > unacceptable → 'unacceptable' band
  };
  /**
   * Screening behaviour. Adverse media defaults to ON per FINAL_LAUNCH_PLAN.md
   * §11.8 with a conservative confidence threshold so analyst hit-volume stays
   * manageable. Tenant admins may lower the threshold or disable adverse media
   * entirely.
   */
  screening: {
    /** Whether adverse-media hits are requested from the screening provider. */
    adverse_media_enabled: boolean;
    /**
     * Minimum match-score (0-100) for adverse-media hits to surface in the
     * case UI. Hits below this score are filtered out by the screening
     * service before persistence. Sanctions and PEP hits are NOT subject to
     * this filter — they always surface regardless of score.
     */
    adverse_media_min_confidence: number;
  };
  /** Branding placeholders; logo upload itself ships in a follow-up sprint. */
  branding: {
    company_name: string | null;
    logo_url: string | null;
  };
  /**
   * UAE Pass identity bridge. When `enabled` is true and the deployment has
   * UAE Pass credentials configured (UAE_PASS_CLIENT_ID + secret), the customer
   * onboarding identity step renders a "Sign in with UAE Pass" affordance.
   *
   * `required_assurance_level` is the minimum UAE Pass userType that the
   * tenant accepts for KYC. UAE Pass returns one of three levels:
   *   SOP1 — basic registration (email+password, NO in-person verification)
   *   SOP2 — verified by SMS one-time-password
   *   SOP3 — verified in person at a UAE Pass kiosk (KYC-grade)
   * Default is SOP3 because SOP1 fails KYC requirements outright.
   */
  uae_pass: {
    enabled: boolean;
    required_assurance_level: 'SOP2' | 'SOP3';
  };
  /** Free-form extension point for per-tenant feature flags. */
  flags: Record<string, boolean | string | number>;
}

export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  modules: {
    individual_kyc: true,
    corporate_kyb: true,
    edd_enabled: true,
    ongoing_screening: false,
  },
  documents: {
    required_individual: ['passport', 'proof_of_address'],
    required_corporate: ['trade_license', 'memorandum_of_association'],
  },
  risk_thresholds: {
    medium: 30,
    high: 60,
    unacceptable: 80,
  },
  screening: {
    adverse_media_enabled: true,
    adverse_media_min_confidence: 85,
  },
  branding: {
    company_name: null,
    logo_url: null,
  },
  uae_pass: {
    enabled: false,
    required_assurance_level: 'SOP3',
  },
  flags: {},
};

export interface TenantConfigRow {
  config_id: string;
  tenant_id: string;
  version: number;
  config: TenantConfig;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}
