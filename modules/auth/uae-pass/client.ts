/**
 * Low-level UAE Pass OIDC client. No DB access — this layer just talks HTTP
 * + crypto. The service layer composes it with the audit + persistence
 * concerns.
 *
 * What this file owns:
 *   - PKCE generation (code_verifier, code_challenge S256)
 *   - state + nonce generation (CSPRNG, base64url, 32 bytes each)
 *   - OIDC discovery fetch
 *   - Authorization URL construction
 *   - Token exchange (authorization_code grant with PKCE + client secret post)
 *   - JWKS fetch + RS256 ID-token signature verification
 *   - Userinfo fetch
 *
 * Signature verification uses Node 18+ `crypto.createPublicKey({ format: 'jwk' })`
 * and `crypto.verify('RSA-SHA256', ...)` so we don't take a dependency on `jose`.
 */

import { createPublicKey, randomBytes, verify as cryptoVerify, createHash } from 'node:crypto';
import {
  OidcDiscoveryDocumentSchema,
  OidcTokenResponseSchema,
  UaePassIdTokenPayloadSchema,
  UaePassUserInfoSchema,
  UaePassError,
  type OidcDiscoveryDocument,
  type OidcTokenResponse,
  type UaePassIdTokenPayload,
  type UaePassUserInfo,
} from './types';
import type { UaePassEnvConfig } from './config';

// ──────────────────────────────────────────────────────────────────────
// CSPRNG helpers
// ──────────────────────────────────────────────────────────────────────

export function generateState(): string {
  return base64UrlEncode(randomBytes(32));
}

export function generateNonce(): string {
  return base64UrlEncode(randomBytes(32));
}

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

export function generatePkce(): PkcePair {
  // RFC 7636: 43–128 unreserved chars. 32 bytes → 43 base64url chars.
  const codeVerifier = base64UrlEncode(randomBytes(32));
  const codeChallenge = base64UrlEncode(createHash('sha256').update(codeVerifier).digest());
  return { codeVerifier, codeChallenge, codeChallengeMethod: 'S256' };
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ──────────────────────────────────────────────────────────────────────
// Discovery + JWKS (cached in-memory; small surface — keep it simple)
// ──────────────────────────────────────────────────────────────────────

interface DiscoveryCacheEntry {
  fetchedAt: number;
  document: OidcDiscoveryDocument;
}
interface JwksCacheEntry {
  fetchedAt: number;
  keys: Array<{ kid: string; jwk: Record<string, unknown> }>;
}

const DISCOVERY_TTL_MS = 60 * 60 * 1000; // 1 hour
const JWKS_TTL_MS = 60 * 60 * 1000;

const discoveryCache = new Map<string, DiscoveryCacheEntry>();
const jwksCache = new Map<string, JwksCacheEntry>();

/** For tests. */
export function clearUaePassCaches(): void {
  discoveryCache.clear();
  jwksCache.clear();
}

export async function getDiscoveryDocument(
  config: UaePassEnvConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<OidcDiscoveryDocument> {
  const cached = discoveryCache.get(config.discoveryUrl);
  if (cached && Date.now() - cached.fetchedAt < DISCOVERY_TTL_MS) return cached.document;

  const res = await fetchImpl(config.discoveryUrl);
  if (!res.ok) {
    throw new UaePassError(
      'unexpected_error',
      `OIDC discovery fetch failed: ${res.status}`,
      `discovery_url=${config.discoveryUrl}`,
    );
  }
  const json = (await res.json()) as unknown;
  const parsed = OidcDiscoveryDocumentSchema.safeParse(json);
  if (!parsed.success) {
    throw new UaePassError('unexpected_error', 'OIDC discovery document is malformed');
  }
  discoveryCache.set(config.discoveryUrl, { fetchedAt: Date.now(), document: parsed.data });
  return parsed.data;
}

async function getJwks(
  jwksUri: string,
  fetchImpl: typeof fetch = fetch,
): Promise<JwksCacheEntry['keys']> {
  const cached = jwksCache.get(jwksUri);
  if (cached && Date.now() - cached.fetchedAt < JWKS_TTL_MS) return cached.keys;

  const res = await fetchImpl(jwksUri);
  if (!res.ok) {
    throw new UaePassError(
      'id_token_signature_invalid',
      `JWKS fetch failed: ${res.status}`,
      `jwks_uri=${jwksUri}`,
    );
  }
  const json = (await res.json()) as { keys?: Array<Record<string, unknown>> };
  const keys = (json.keys ?? [])
    .filter((k) => typeof k.kid === 'string')
    .map((jwk) => ({ kid: jwk.kid as string, jwk }));
  if (!keys.length) {
    throw new UaePassError('id_token_signature_invalid', 'JWKS returned no keys');
  }
  jwksCache.set(jwksUri, { fetchedAt: Date.now(), keys });
  return keys;
}

// ──────────────────────────────────────────────────────────────────────
// Authorization URL
// ──────────────────────────────────────────────────────────────────────

export interface BuildAuthorizationUrlInput {
  config: UaePassEnvConfig;
  discovery: OidcDiscoveryDocument;
  state: string;
  nonce: string;
  pkce: PkcePair;
}

export function buildAuthorizationUrl(input: BuildAuthorizationUrlInput): string {
  const { config, discovery, state, nonce, pkce } = input;
  const url = new URL(discovery.authorization_endpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('scope', ['openid', ...config.scopes].join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('acr_values', config.acrValues);
  url.searchParams.set('code_challenge', pkce.codeChallenge);
  url.searchParams.set('code_challenge_method', pkce.codeChallengeMethod);
  return url.toString();
}

// ──────────────────────────────────────────────────────────────────────
// Token exchange
// ──────────────────────────────────────────────────────────────────────

export interface ExchangeCodeInput {
  config: UaePassEnvConfig;
  discovery: OidcDiscoveryDocument;
  code: string;
  codeVerifier: string;
}

export async function exchangeCodeForTokens(
  input: ExchangeCodeInput,
  fetchImpl: typeof fetch = fetch,
): Promise<OidcTokenResponse> {
  const { config, discovery, code, codeVerifier } = input;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code_verifier: codeVerifier,
  });

  const res = await fetchImpl(discovery.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new UaePassError(
      'token_exchange_failed',
      `Token exchange failed with status ${res.status}`,
      truncate(text, 500),
    );
  }
  const json = (await res.json()) as unknown;
  const parsed = OidcTokenResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new UaePassError('token_exchange_failed', 'Token endpoint response did not match expected schema');
  }
  return parsed.data;
}

// ──────────────────────────────────────────────────────────────────────
// ID token verification
// ──────────────────────────────────────────────────────────────────────

export interface VerifyIdTokenInput {
  idToken: string;
  config: UaePassEnvConfig;
  discovery: OidcDiscoveryDocument;
  expectedNonce: string;
  /** Optional — defaults to Date.now(). Tests inject a fixed clock. */
  now?: () => number;
  fetchImpl?: typeof fetch;
}

/**
 * Validate a UAE Pass ID token end-to-end:
 *   1. Header.payload.signature shape
 *   2. Algorithm == RS256 (UAE Pass signs with RS256)
 *   3. Signature verifies against a JWKS key matching the JWT `kid`
 *   4. iss == discovery.issuer
 *   5. aud contains client_id
 *   6. exp > now (with 60s clock-skew tolerance)
 *   7. nonce == expectedNonce
 *
 * Throws UaePassError with a precise code on any failure.
 */
export async function verifyIdToken(input: VerifyIdTokenInput): Promise<UaePassIdTokenPayload> {
  const { idToken, config, discovery, expectedNonce } = input;
  const now = input.now ?? Date.now;
  const fetchImpl = input.fetchImpl ?? fetch;

  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new UaePassError('id_token_invalid', 'ID token does not have three segments');
  }
  const [headerB64, payloadB64, sigB64] = parts;

  let header: { alg?: string; kid?: string };
  try {
    header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'));
  } catch {
    throw new UaePassError('id_token_invalid', 'ID token header is not valid JSON');
  }
  if (header.alg !== 'RS256') {
    throw new UaePassError(
      'id_token_signature_invalid',
      `Unsupported ID token algorithm: ${header.alg ?? 'unknown'} (expected RS256)`,
    );
  }
  if (!header.kid) {
    throw new UaePassError('id_token_signature_invalid', 'ID token header missing kid');
  }

  const keys = await getJwks(discovery.jwks_uri, fetchImpl);
  const match = keys.find((k) => k.kid === header.kid);
  if (!match) {
    throw new UaePassError(
      'id_token_signature_invalid',
      `No JWKS key matched JWT kid=${header.kid}`,
    );
  }

  let publicKey;
  try {
    publicKey = createPublicKey({ key: match.jwk as never, format: 'jwk' });
  } catch {
    throw new UaePassError('id_token_signature_invalid', 'JWKS key could not be imported');
  }

  const signingInput = Buffer.from(`${headerB64}.${payloadB64}`, 'utf8');
  const signature = base64UrlDecode(sigB64);
  const ok = cryptoVerify('RSA-SHA256', signingInput, publicKey, signature);
  if (!ok) {
    throw new UaePassError('id_token_signature_invalid', 'ID token signature did not verify');
  }

  let payloadJson: unknown;
  try {
    payloadJson = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));
  } catch {
    throw new UaePassError('id_token_invalid', 'ID token payload is not valid JSON');
  }
  const parsed = UaePassIdTokenPayloadSchema.safeParse(payloadJson);
  if (!parsed.success) {
    throw new UaePassError('id_token_invalid', 'ID token payload missing required claims');
  }
  const payload = parsed.data;

  if (payload.iss !== discovery.issuer) {
    throw new UaePassError(
      'id_token_issuer_mismatch',
      `iss=${payload.iss} did not match discovery issuer ${discovery.issuer}`,
    );
  }

  const audOk = Array.isArray(payload.aud)
    ? payload.aud.includes(config.clientId)
    : payload.aud === config.clientId;
  if (!audOk) {
    throw new UaePassError(
      'id_token_audience_mismatch',
      `aud did not include client_id ${config.clientId}`,
    );
  }

  const nowSeconds = Math.floor(now() / 1000);
  if (payload.exp + 60 < nowSeconds) {
    throw new UaePassError('id_token_expired', `ID token expired at ${payload.exp}`);
  }
  if (payload.nonce !== expectedNonce) {
    throw new UaePassError(
      'id_token_nonce_mismatch',
      'ID token nonce did not match the value bound to this authorization request',
    );
  }

  return payload;
}

// ──────────────────────────────────────────────────────────────────────
// Userinfo
// ──────────────────────────────────────────────────────────────────────

export async function fetchUserInfo(
  discovery: OidcDiscoveryDocument,
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<UaePassUserInfo> {
  const res = await fetchImpl(discovery.userinfo_endpoint, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new UaePassError(
      'userinfo_failed',
      `Userinfo fetch failed with status ${res.status}`,
      truncate(text, 500),
    );
  }
  const json = (await res.json()) as unknown;
  const parsed = UaePassUserInfoSchema.safeParse(json);
  if (!parsed.success) {
    throw new UaePassError('userinfo_failed', 'Userinfo payload missing required claims');
  }
  return parsed.data;
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function base64UrlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}
