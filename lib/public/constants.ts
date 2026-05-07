/**
 * Fields that must NEVER appear in a public API response or client-side
 * data structure. Every `toPublic<Model>` helper and the QA
 * `assertNoForbiddenFields` check reads from this set.
 *
 * AML/KYC/CDD Portal — internal-only fields.
 */
export const FORBIDDEN_FIELD_SET = new Set<string>([
  // Auth internals
  'password_hash',
  'hashed_password',
  'reset_token',
  'email_verification_token',
  'totp_secret',
  'mfa_secret',
  'recovery_codes',

  // Internal AML/risk fields — use public aliases in API responses
  'raw_risk_score',
  'internal_risk_notes',
  'screening_raw_response',
  'idv_raw_response',
  'fraud_flag',
  'admin_override',
  'internal_notes',

  // Raw PII (use masked / anonymised versions in public responses)
  'raw_id_number',
  'raw_tax_id',
  'full_dob',
  'raw_ssn',

  // Service keys / internal identifiers
  'supabase_uid',          // expose app-level user_id only
  'stripe_customer_id',    // use masked alias
  'webhook_secret',
  'signing_key',

  // Audit / chain internals
  'prev_hash',             // audit chain internal — not for API consumers
  'hash',                  // same
])
