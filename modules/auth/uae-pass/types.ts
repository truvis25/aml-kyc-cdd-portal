/**
 * UAE Pass OIDC types.
 *
 * UAE Pass is the UAE government's national digital identity. The integration
 * is a standard OIDC authorization-code-with-PKCE flow against the IdP
 * documented at https://docs.uaepass.ae/. This file centralises the wire-shape
 * Zod schemas so the rest of the module stays loosely coupled to UAE Pass
 * vocabulary.
 *
 * The schemas are tolerant: UAE Pass occasionally adds locale-specific
 * variants of name fields (titleAR, firstnameAR, etc.) that we don't actively
 * use. We persist the full userinfo response in `uae_pass_authentications.claims`
 * and only validate the fields we read.
 */

import { z } from 'zod';

// ──────────────────────────────────────────────────────────────────────
// OIDC discovery + token endpoints
// ──────────────────────────────────────────────────────────────────────

export const OidcDiscoveryDocumentSchema = z.object({
  issuer: z.string().url(),
  authorization_endpoint: z.string().url(),
  token_endpoint: z.string().url(),
  userinfo_endpoint: z.string().url(),
  jwks_uri: z.string().url(),
});
export type OidcDiscoveryDocument = z.infer<typeof OidcDiscoveryDocumentSchema>;

export const OidcTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
  expires_in: z.number().int().positive().optional(),
  id_token: z.string().min(1),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});
export type OidcTokenResponse = z.infer<typeof OidcTokenResponseSchema>;

// ──────────────────────────────────────────────────────────────────────
// UAE Pass userinfo claims
// ──────────────────────────────────────────────────────────────────────

/**
 * UAE Pass userType values:
 *   SOP1     — basic registration (NOT KYC-grade; never accept)
 *   SOP2     — verified by SMS OTP
 *   SOP3     — verified in person at a UAE Pass kiosk
 *   VISITOR  — non-resident visitor account
 */
export const UaePassAssuranceLevelSchema = z.enum(['SOP1', 'SOP2', 'SOP3', 'VISITOR']);
export type UaePassAssuranceLevel = z.infer<typeof UaePassAssuranceLevelSchema>;

export const UaePassUserInfoSchema = z
  .object({
    sub: z.string().min(1),
    fullnameEN: z.string().optional(),
    fullnameAR: z.string().optional(),
    firstnameEN: z.string().optional(),
    lastnameEN: z.string().optional(),
    gender: z.string().optional(),
    nationalityEN: z.string().optional(),
    nationalityAR: z.string().optional(),
    /** Emirates ID, 15 digits, sometimes with separators. */
    idn: z.string().optional(),
    /** SOP1 / SOP2 / SOP3 / VISITOR. UAE Pass returns a string. */
    userType: UaePassAssuranceLevelSchema,
    mobile: z.string().optional(),
    email: z.string().optional(),
    /** Date of birth. UAE Pass historically returns DD/MM/YYYY. */
    dob: z.string().optional(),
    spuuid: z.string().optional(),
    uuid: z.string().optional(),
    titleEN: z.string().optional(),
  })
  .passthrough();
export type UaePassUserInfo = z.infer<typeof UaePassUserInfoSchema>;

// ──────────────────────────────────────────────────────────────────────
// ID token payload (a subset; we validate iss / aud / exp / nonce)
// ──────────────────────────────────────────────────────────────────────

export const UaePassIdTokenPayloadSchema = z
  .object({
    iss: z.string().min(1),
    aud: z.union([z.string().min(1), z.array(z.string().min(1)).nonempty()]),
    sub: z.string().min(1),
    exp: z.number().int(),
    iat: z.number().int(),
    nonce: z.string().min(1).optional(),
  })
  .passthrough();
export type UaePassIdTokenPayload = z.infer<typeof UaePassIdTokenPayloadSchema>;

// ──────────────────────────────────────────────────────────────────────
// Internal error taxonomy. These end up in audit_log payloads and the
// uae_pass_authentications.error_code column, so keep them stable.
// ──────────────────────────────────────────────────────────────────────

export const UaePassErrorCodeSchema = z.enum([
  'not_configured',
  'state_unknown',
  'state_already_completed',
  'idp_returned_error',
  'token_exchange_failed',
  'id_token_invalid',
  'id_token_signature_invalid',
  'id_token_audience_mismatch',
  'id_token_issuer_mismatch',
  'id_token_expired',
  'id_token_nonce_mismatch',
  'userinfo_failed',
  'assurance_level_too_low',
  'unexpected_error',
]);
export type UaePassErrorCode = z.infer<typeof UaePassErrorCodeSchema>;

export class UaePassError extends Error {
  readonly code: UaePassErrorCode;
  readonly detail: string | undefined;

  constructor(code: UaePassErrorCode, message: string, detail?: string) {
    super(message);
    this.name = 'UaePassError';
    this.code = code;
    this.detail = detail;
  }
}
