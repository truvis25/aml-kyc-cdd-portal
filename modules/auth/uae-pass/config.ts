/**
 * UAE Pass environment configuration. The deployment is "configured" when
 * UAE_PASS_DISCOVERY_URL, UAE_PASS_CLIENT_ID, and UAE_PASS_CLIENT_SECRET are
 * all populated; otherwise the integration is disabled and the API routes
 * return 503 even if a tenant has flipped `tenant_config.uae_pass.enabled`
 * to true.
 */

const DEFAULT_SCOPES = ['urn:uae:digitalid:profile:general'];
const DEFAULT_ACR_VALUES =
  'urn:safelayer:tws:policies:authentication:level:low:mobileondemand';

export interface UaePassEnvConfig {
  discoveryUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  acrValues: string;
}

export interface UaePassConfigStatus {
  configured: boolean;
  config: UaePassEnvConfig | null;
  reason: string | null;
}

/**
 * Read the UAE Pass configuration from process.env. Returns `configured: false`
 * with a human-readable `reason` when any required field is missing.
 *
 * Pure function for testability — pass an explicit env object to override.
 */
export function readUaePassConfig(
  env: NodeJS.ProcessEnv = process.env,
): UaePassConfigStatus {
  const discoveryUrl = env.UAE_PASS_DISCOVERY_URL?.trim();
  const clientId = env.UAE_PASS_CLIENT_ID?.trim();
  const clientSecret = env.UAE_PASS_CLIENT_SECRET?.trim();
  const explicitRedirect = env.UAE_PASS_REDIRECT_URI?.trim();
  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim();

  if (!discoveryUrl) {
    return { configured: false, config: null, reason: 'UAE_PASS_DISCOVERY_URL not set' };
  }
  if (!clientId) {
    return { configured: false, config: null, reason: 'UAE_PASS_CLIENT_ID not set' };
  }
  if (!clientSecret) {
    return { configured: false, config: null, reason: 'UAE_PASS_CLIENT_SECRET not set' };
  }

  const redirectUri = explicitRedirect
    ? explicitRedirect
    : appUrl
      ? `${stripTrailingSlash(appUrl)}/api/auth/uae-pass/callback`
      : null;
  if (!redirectUri) {
    return {
      configured: false,
      config: null,
      reason: 'Either UAE_PASS_REDIRECT_URI or NEXT_PUBLIC_APP_URL must be set',
    };
  }

  const rawScopes = env.UAE_PASS_SCOPES?.trim();
  const scopes = rawScopes
    ? rawScopes.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_SCOPES;
  if (!scopes.length) {
    return {
      configured: false,
      config: null,
      reason: 'UAE_PASS_SCOPES, when set, must contain at least one scope',
    };
  }

  const acrValues = env.UAE_PASS_ACR_VALUES?.trim() || DEFAULT_ACR_VALUES;

  return {
    configured: true,
    reason: null,
    config: { discoveryUrl, clientId, clientSecret, redirectUri, scopes, acrValues },
  };
}

function stripTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}
