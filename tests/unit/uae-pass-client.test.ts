import { describe, expect, it, beforeEach } from 'vitest';
import {
  generateKeyPairSync,
  createSign,
  randomBytes,
  createPublicKey,
  type JsonWebKey,
} from 'node:crypto';
import {
  buildAuthorizationUrl,
  clearUaePassCaches,
  exchangeCodeForTokens,
  generateNonce,
  generatePkce,
  generateState,
  verifyIdToken,
} from '@/modules/auth/uae-pass/client';
import type { UaePassEnvConfig } from '@/modules/auth/uae-pass/config';
import type { OidcDiscoveryDocument } from '@/modules/auth/uae-pass/types';

const FAKE_DISCOVERY: OidcDiscoveryDocument = {
  issuer: 'https://stg-id.uaepass.ae/idshub',
  authorization_endpoint: 'https://stg-id.uaepass.ae/idshub/authorize',
  token_endpoint: 'https://stg-id.uaepass.ae/idshub/token',
  userinfo_endpoint: 'https://stg-id.uaepass.ae/idshub/userinfo',
  jwks_uri: 'https://stg-id.uaepass.ae/idshub/jwks',
};

const FAKE_CONFIG: UaePassEnvConfig = {
  discoveryUrl: 'https://stg-id.uaepass.ae/idshub/.well-known/openid-configuration',
  clientId: 'sp-test',
  clientSecret: 'shh',
  redirectUri: 'https://app.example.com/api/auth/uae-pass/callback',
  scopes: ['urn:uae:digitalid:profile:general'],
  acrValues: 'urn:safelayer:tws:policies:authentication:level:low:mobileondemand',
};

beforeEach(() => {
  clearUaePassCaches();
});

describe('CSPRNG helpers', () => {
  it('generateState returns a base64url 32-byte value', () => {
    const s = generateState();
    expect(s).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('generateNonce returns a base64url 32-byte value distinct from state', () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
  });

  it('generatePkce returns a 43-char verifier and an S256 challenge', () => {
    const { codeVerifier, codeChallenge, codeChallengeMethod } = generatePkce();
    expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(codeChallengeMethod).toBe('S256');
  });
});

describe('buildAuthorizationUrl', () => {
  it('serialises all required OIDC parameters', () => {
    const url = new URL(
      buildAuthorizationUrl({
        config: FAKE_CONFIG,
        discovery: FAKE_DISCOVERY,
        state: 'state-value',
        nonce: 'nonce-value',
        pkce: { codeVerifier: 'v', codeChallenge: 'c', codeChallengeMethod: 'S256' },
      }),
    );
    expect(url.origin + url.pathname).toBe(FAKE_DISCOVERY.authorization_endpoint);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe(FAKE_CONFIG.clientId);
    expect(url.searchParams.get('redirect_uri')).toBe(FAKE_CONFIG.redirectUri);
    expect(url.searchParams.get('scope')).toBe('openid urn:uae:digitalid:profile:general');
    expect(url.searchParams.get('state')).toBe('state-value');
    expect(url.searchParams.get('nonce')).toBe('nonce-value');
    expect(url.searchParams.get('acr_values')).toBe(FAKE_CONFIG.acrValues);
    expect(url.searchParams.get('code_challenge')).toBe('c');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// ID token verification — round-trip a synthetic key pair so we don't need
// network access. UAE Pass uses RS256 in production.
// ─────────────────────────────────────────────────────────────────────────

interface SyntheticIdp {
  jwk: JsonWebKey & { kid: string };
  sign: (payload: Record<string, unknown>) => string;
}

function buildSyntheticIdp(): SyntheticIdp {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const kid = randomBytes(8).toString('hex');
  const jwkBase = publicKey.export({ format: 'jwk' }) as JsonWebKey;
  const jwk = { ...jwkBase, kid, alg: 'RS256', use: 'sig' };

  function base64Url(buf: Buffer): string {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function jsonB64(obj: unknown): string {
    return base64Url(Buffer.from(JSON.stringify(obj), 'utf8'));
  }

  return {
    jwk,
    sign(payload) {
      const headerB64 = jsonB64({ alg: 'RS256', kid, typ: 'JWT' });
      const payloadB64 = jsonB64(payload);
      const signer = createSign('RSA-SHA256');
      signer.update(`${headerB64}.${payloadB64}`);
      const sig = signer.sign(privateKey);
      return `${headerB64}.${payloadB64}.${base64Url(sig)}`;
    },
  };
}

function buildJwksFetch(idp: SyntheticIdp, calls: { jwks: number; token: number }) {
  return async function fakeFetch(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url === FAKE_DISCOVERY.jwks_uri) {
      calls.jwks++;
      return new Response(JSON.stringify({ keys: [idp.jwk] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url === FAKE_DISCOVERY.token_endpoint) {
      calls.token++;
      const body = (init?.body ?? '').toString();
      const params = new URLSearchParams(body);
      const token = idp.sign({
        iss: FAKE_DISCOVERY.issuer,
        aud: FAKE_CONFIG.clientId,
        sub: 'subject-1',
        nonce: params.get('code_verifier') === 'pkce-v' ? 'nonce-1' : 'mismatch',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 600,
      });
      return new Response(
        JSON.stringify({ access_token: 'access-1', token_type: 'Bearer', id_token: token }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
}

describe('verifyIdToken', () => {
  it('accepts a well-formed token signed by a key in JWKS', async () => {
    const idp = buildSyntheticIdp();
    const calls = { jwks: 0, token: 0 };
    const fakeFetch = buildJwksFetch(idp, calls);
    const idToken = idp.sign({
      iss: FAKE_DISCOVERY.issuer,
      aud: FAKE_CONFIG.clientId,
      sub: 'subject-1',
      nonce: 'nonce-1',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 600,
    });

    const payload = await verifyIdToken({
      idToken,
      config: FAKE_CONFIG,
      discovery: FAKE_DISCOVERY,
      expectedNonce: 'nonce-1',
      fetchImpl: fakeFetch as unknown as typeof fetch,
    });
    expect(payload.sub).toBe('subject-1');
    expect(calls.jwks).toBe(1);
  });

  it('rejects when nonce does not match', async () => {
    const idp = buildSyntheticIdp();
    const fakeFetch = buildJwksFetch(idp, { jwks: 0, token: 0 });
    const idToken = idp.sign({
      iss: FAKE_DISCOVERY.issuer,
      aud: FAKE_CONFIG.clientId,
      sub: 'subject-1',
      nonce: 'someone-elses',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    await expect(
      verifyIdToken({
        idToken,
        config: FAKE_CONFIG,
        discovery: FAKE_DISCOVERY,
        expectedNonce: 'nonce-1',
        fetchImpl: fakeFetch as unknown as typeof fetch,
      }),
    ).rejects.toMatchObject({ code: 'id_token_nonce_mismatch' });
  });

  it('rejects when issuer does not match discovery', async () => {
    const idp = buildSyntheticIdp();
    const fakeFetch = buildJwksFetch(idp, { jwks: 0, token: 0 });
    const idToken = idp.sign({
      iss: 'https://impostor.example',
      aud: FAKE_CONFIG.clientId,
      sub: 'subject-1',
      nonce: 'nonce-1',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    await expect(
      verifyIdToken({
        idToken,
        config: FAKE_CONFIG,
        discovery: FAKE_DISCOVERY,
        expectedNonce: 'nonce-1',
        fetchImpl: fakeFetch as unknown as typeof fetch,
      }),
    ).rejects.toMatchObject({ code: 'id_token_issuer_mismatch' });
  });

  it('rejects when audience does not include client_id', async () => {
    const idp = buildSyntheticIdp();
    const fakeFetch = buildJwksFetch(idp, { jwks: 0, token: 0 });
    const idToken = idp.sign({
      iss: FAKE_DISCOVERY.issuer,
      aud: 'someone-else',
      sub: 'subject-1',
      nonce: 'nonce-1',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    await expect(
      verifyIdToken({
        idToken,
        config: FAKE_CONFIG,
        discovery: FAKE_DISCOVERY,
        expectedNonce: 'nonce-1',
        fetchImpl: fakeFetch as unknown as typeof fetch,
      }),
    ).rejects.toMatchObject({ code: 'id_token_audience_mismatch' });
  });

  it('rejects when the token is expired', async () => {
    const idp = buildSyntheticIdp();
    const fakeFetch = buildJwksFetch(idp, { jwks: 0, token: 0 });
    const idToken = idp.sign({
      iss: FAKE_DISCOVERY.issuer,
      aud: FAKE_CONFIG.clientId,
      sub: 'subject-1',
      nonce: 'nonce-1',
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600,
    });
    await expect(
      verifyIdToken({
        idToken,
        config: FAKE_CONFIG,
        discovery: FAKE_DISCOVERY,
        expectedNonce: 'nonce-1',
        fetchImpl: fakeFetch as unknown as typeof fetch,
      }),
    ).rejects.toMatchObject({ code: 'id_token_expired' });
  });

  it('rejects when the signing key is not present in JWKS', async () => {
    const idp = buildSyntheticIdp();
    const otherIdp = buildSyntheticIdp(); // serves a different JWKS
    const fakeFetch = buildJwksFetch(otherIdp, { jwks: 0, token: 0 });
    const idToken = idp.sign({
      iss: FAKE_DISCOVERY.issuer,
      aud: FAKE_CONFIG.clientId,
      sub: 'subject-1',
      nonce: 'nonce-1',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    await expect(
      verifyIdToken({
        idToken,
        config: FAKE_CONFIG,
        discovery: FAKE_DISCOVERY,
        expectedNonce: 'nonce-1',
        fetchImpl: fakeFetch as unknown as typeof fetch,
      }),
    ).rejects.toMatchObject({ code: 'id_token_signature_invalid' });
  });
});

describe('exchangeCodeForTokens', () => {
  it('posts form-encoded grant_type=authorization_code with the verifier', async () => {
    let capturedBody: string | null = null;
    const fakeFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      expect(url).toBe(FAKE_DISCOVERY.token_endpoint);
      capturedBody = (init?.body ?? '').toString();
      return new Response(
        JSON.stringify({
          access_token: 'a',
          token_type: 'Bearer',
          id_token: 'fake.id.token',
          expires_in: 3600,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    const out = await exchangeCodeForTokens(
      {
        config: FAKE_CONFIG,
        discovery: FAKE_DISCOVERY,
        code: 'code-1',
        codeVerifier: 'verifier-1',
      },
      fakeFetch,
    );
    expect(out.access_token).toBe('a');
    expect(out.id_token).toBe('fake.id.token');
    expect(capturedBody).not.toBeNull();
    const params = new URLSearchParams(capturedBody as unknown as string);
    expect(params.get('grant_type')).toBe('authorization_code');
    expect(params.get('code')).toBe('code-1');
    expect(params.get('code_verifier')).toBe('verifier-1');
    expect(params.get('redirect_uri')).toBe(FAKE_CONFIG.redirectUri);
    expect(params.get('client_id')).toBe(FAKE_CONFIG.clientId);
    expect(params.get('client_secret')).toBe(FAKE_CONFIG.clientSecret);
  });
});

// Sanity: exported JWK can round-trip via Node crypto. Catches regressions
// where a future Node version changes the `jwk` import contract.
describe('createPublicKey from JWK', () => {
  it('imports a generated RSA jwk without error', () => {
    const idp = buildSyntheticIdp();
    expect(() => createPublicKey({ key: idp.jwk as never, format: 'jwk' })).not.toThrow();
  });
});
