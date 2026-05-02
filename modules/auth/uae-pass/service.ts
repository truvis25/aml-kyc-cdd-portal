/**
 * UAE Pass orchestration. Composes the OIDC client, persistence, and audit
 * concerns the route handlers need:
 *
 *   initiateAuthentication() — called from POST /api/auth/uae-pass/authorize
 *   completeAuthentication()  — called from GET /api/auth/uae-pass/callback
 *   getLatestSucceededAuthentication() — read for identity-form pre-fill
 *
 * Persistence lives in modules/auth/uae-pass/repository.ts; this file is
 * deliberately free of `from('uae_pass_authentications')` calls so the
 * orchestration logic can be unit-tested without a Supabase fixture.
 */

import { emit } from '@/modules/audit/audit.service';
import { AuditEntityType, AuditEventType } from '@/lib/constants/events';
import { readUaePassConfig } from './config';
import {
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  fetchUserInfo,
  generateNonce,
  generatePkce,
  generateState,
  getDiscoveryDocument,
  verifyIdToken,
} from './client';
import {
  insertInitiatedAuthentication,
  markAuthenticationFailed,
  markAuthenticationSucceeded,
  loadAuthenticationByState,
  loadLatestSucceededAuthenticationForSession,
  type UaePassAuthenticationRow,
} from './repository';
import { UaePassError, type UaePassUserInfo, type UaePassAssuranceLevel } from './types';

// ──────────────────────────────────────────────────────────────────────
// Initiate
// ──────────────────────────────────────────────────────────────────────

export interface InitiateInput {
  tenantId: string;
  onboardingSessionId: string;
  requiredAssuranceLevel: 'SOP2' | 'SOP3';
  actorId?: string;
}

export interface InitiateResult {
  authorizationUrl: string;
  authenticationId: string;
  state: string;
}

export async function initiateAuthentication(
  input: InitiateInput,
): Promise<InitiateResult> {
  const status = readUaePassConfig();
  if (!status.configured || !status.config) {
    throw new UaePassError('not_configured', status.reason ?? 'UAE Pass is not configured');
  }
  const config = status.config;

  const state = generateState();
  const nonce = generateNonce();
  const pkce = generatePkce();

  const row = await insertInitiatedAuthentication({
    tenant_id: input.tenantId,
    onboarding_session_id: input.onboardingSessionId,
    state,
    nonce,
    code_verifier: pkce.codeVerifier,
    required_assurance_level: input.requiredAssuranceLevel,
  });

  const discovery = await getDiscoveryDocument(config);
  const authorizationUrl = buildAuthorizationUrl({ config, discovery, state, nonce, pkce });

  await emit({
    tenant_id: input.tenantId,
    event_type: AuditEventType.UAE_PASS_AUTHENTICATION_INITIATED,
    entity_type: AuditEntityType.UAE_PASS_AUTHENTICATION,
    entity_id: row.id,
    actor_id: input.actorId,
    session_id: input.onboardingSessionId,
    payload: {
      required_assurance_level: input.requiredAssuranceLevel,
    },
  });

  return { authorizationUrl, authenticationId: row.id, state };
}

// ──────────────────────────────────────────────────────────────────────
// Complete
// ──────────────────────────────────────────────────────────────────────

export interface CompleteInput {
  /** Querystring params from the IdP's redirect back. */
  state: string | null;
  code: string | null;
  /** When set, the IdP returned an error response instead of a code. */
  idpError: string | null;
  idpErrorDescription: string | null;
  actorId?: string;
}

export interface CompleteResult {
  authenticationId: string;
  onboardingSessionId: string;
  tenantId: string;
  subject: string;
  userType: UaePassAssuranceLevel;
  claims: UaePassUserInfo;
}

export async function completeAuthentication(
  input: CompleteInput,
): Promise<CompleteResult> {
  if (!input.state) {
    throw new UaePassError('state_unknown', 'Callback missing state parameter');
  }

  const row = await loadAuthenticationByState(input.state);
  if (!row) {
    throw new UaePassError('state_unknown', 'No pending authentication matched the supplied state');
  }
  if (row.status !== 'initiated') {
    throw new UaePassError(
      'state_already_completed',
      `Authentication ${row.id} has already terminated in status ${row.status}`,
    );
  }

  // From here on we know which row to update on failure.
  try {
    if (input.idpError) {
      throw new UaePassError(
        'idp_returned_error',
        `IdP returned error=${input.idpError}`,
        input.idpErrorDescription ?? undefined,
      );
    }
    if (!input.code) {
      throw new UaePassError('idp_returned_error', 'Callback missing both code and error');
    }

    const status = readUaePassConfig();
    if (!status.configured || !status.config) {
      throw new UaePassError('not_configured', status.reason ?? 'UAE Pass is not configured');
    }
    const config = status.config;

    const discovery = await getDiscoveryDocument(config);
    const tokens = await exchangeCodeForTokens({
      config,
      discovery,
      code: input.code,
      codeVerifier: row.code_verifier,
    });

    await verifyIdToken({
      idToken: tokens.id_token,
      config,
      discovery,
      expectedNonce: row.nonce,
    });

    const claims = await fetchUserInfo(discovery, tokens.access_token);

    if (!isAssuranceAcceptable(claims.userType, row.required_assurance_level)) {
      throw new UaePassError(
        'assurance_level_too_low',
        `userType=${claims.userType} does not satisfy tenant policy ${row.required_assurance_level}`,
      );
    }

    const updated = await markAuthenticationSucceeded({
      id: row.id,
      tenant_id: row.tenant_id,
      subject: claims.sub,
      user_type: claims.userType,
      claims,
    });

    await emit({
      tenant_id: row.tenant_id,
      event_type: AuditEventType.UAE_PASS_AUTHENTICATION_SUCCEEDED,
      entity_type: AuditEntityType.UAE_PASS_AUTHENTICATION,
      entity_id: row.id,
      actor_id: input.actorId,
      session_id: row.onboarding_session_id,
      payload: {
        subject: claims.sub,
        user_type: claims.userType,
        required_assurance_level: row.required_assurance_level,
      },
    });

    return {
      authenticationId: updated.id,
      onboardingSessionId: updated.onboarding_session_id,
      tenantId: updated.tenant_id,
      subject: updated.subject ?? claims.sub,
      userType: claims.userType,
      claims,
    };
  } catch (err) {
    const error = toUaePassError(err);
    await markAuthenticationFailed({
      id: row.id,
      tenant_id: row.tenant_id,
      error_code: error.code,
      error_detail: error.detail ?? error.message,
    });
    await emit({
      tenant_id: row.tenant_id,
      event_type: AuditEventType.UAE_PASS_AUTHENTICATION_FAILED,
      entity_type: AuditEntityType.UAE_PASS_AUTHENTICATION,
      entity_id: row.id,
      actor_id: input.actorId,
      session_id: row.onboarding_session_id,
      payload: { error_code: error.code },
    });
    throw error;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Pre-fill read path
// ──────────────────────────────────────────────────────────────────────

export async function getLatestSucceededAuthentication(
  onboardingSessionId: string,
  tenantId: string,
): Promise<UaePassAuthenticationRow | null> {
  return loadLatestSucceededAuthenticationForSession(onboardingSessionId, tenantId);
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

/**
 * Tenant policy check. A required_assurance_level of SOP2 means SOP2 or SOP3
 * is acceptable; SOP3 means SOP3 only. SOP1 and VISITOR are never KYC-grade.
 */
export function isAssuranceAcceptable(
  observed: UaePassAssuranceLevel,
  required: 'SOP2' | 'SOP3',
): boolean {
  if (observed === 'SOP1' || observed === 'VISITOR') return false;
  if (required === 'SOP3') return observed === 'SOP3';
  return observed === 'SOP2' || observed === 'SOP3';
}

function toUaePassError(err: unknown): UaePassError {
  if (err instanceof UaePassError) return err;
  const message = err instanceof Error ? err.message : 'Unknown error';
  return new UaePassError('unexpected_error', message);
}
