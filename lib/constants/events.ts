// Canonical audit event types
// Source of truth: PRD v1.0 Section 4.4 — Audit Trail Data Design
export enum AuditEventType {
  // Session events
  SESSION_INITIATED = 'session.initiated',
  SESSION_STEP_SUBMITTED = 'session.step_submitted',
  SESSION_COMPLETED = 'session.completed',
  SESSION_ABANDONED = 'session.abandoned',
  SESSION_RESUMED = 'session.resumed',

  // Consent events
  CONSENT_CAPTURED = 'consent.captured',
  CONSENT_WITHDRAWN = 'consent.withdrawn',

  // Customer data events
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_FIELD_CHANGED = 'customer.field_changed',

  // Document events
  DOCUMENT_UPLOADED = 'document.uploaded',
  DOCUMENT_HASH_COMPUTED = 'document.hash_computed',
  DOCUMENT_REVIEWED = 'document.reviewed',
  DOCUMENT_ACCEPTED = 'document.accepted',
  DOCUMENT_REJECTED = 'document.rejected',
  DOCUMENT_EXPIRED = 'document.expired',

  // KYC events
  KYC_INITIATED = 'kyc.initiated',
  KYC_RESULT_RECEIVED = 'kyc.result_received',
  KYC_PASSED = 'kyc.passed',
  KYC_FAILED = 'kyc.failed',

  // Screening events
  SCREENING_INITIATED = 'screening.initiated',
  SCREENING_COMPLETED = 'screening.completed',
  SCREENING_HIT_GENERATED = 'screening.hit_generated',
  SCREENING_HIT_RESOLVED = 'screening.hit_resolved',

  // Risk events
  RISK_SCORE_COMPUTED = 'risk.score_computed',

  // Case events
  CASE_CREATED = 'case.created',
  CASE_ASSIGNED = 'case.assigned',
  CASE_NOTE_ADDED = 'case.note_added',
  CASE_RAI_SENT = 'case.rai_sent',
  CASE_ESCALATED = 'case.escalated',
  CASE_DECISION_RECORDED = 'case.decision_recorded',

  // Approval events
  APPROVAL_GRANTED = 'approval.granted',
  APPROVAL_REJECTED = 'approval.rejected',

  // User/auth events
  USER_INVITED = 'user.invited',
  USER_ACTIVATED = 'user.activated',
  USER_ROLE_ASSIGNED = 'user.role_assigned',
  USER_ROLE_REVOKED = 'user.role_revoked',
  USER_SIGNED_IN = 'user.signed_in',
  USER_SIGNED_OUT = 'user.signed_out',
  USER_MFA_SETUP = 'user.mfa_setup',
  USER_LOGIN_FAILED = 'user.login_failed',

  // Admin events
  CONFIG_CHANGED = 'admin.config_changed',
  WORKFLOW_ACTIVATED = 'admin.workflow_activated',
  WORKFLOW_DEACTIVATED = 'admin.workflow_deactivated',

  // System events
  WEBHOOK_RECEIVED = 'system.webhook_received',
  WEBHOOK_PROCESSED = 'system.webhook_processed',
  WEBHOOK_FAILED = 'system.webhook_failed',
}

// Entity types for audit_log.entity_type
export enum AuditEntityType {
  TENANT = 'tenants',
  USER = 'users',
  USER_ROLE = 'user_roles',
  SESSION = 'onboarding_sessions',
  CUSTOMER = 'customers',
  DOCUMENT = 'documents',
  CONSENT = 'consent_records',
  SCREENING_JOB = 'screening_jobs',
  SCREENING_HIT = 'screening_hits',
  RISK_ASSESSMENT = 'risk_assessments',
  CASE = 'cases',
  APPROVAL = 'approvals',
  TENANT_CONFIG = 'tenant_config',
  WORKFLOW_DEFINITION = 'workflow_definitions',
}
