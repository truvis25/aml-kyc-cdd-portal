import { describe, expect, it } from 'vitest';
import { readUaePassConfig } from '@/modules/auth/uae-pass/config';

const baseEnv = {
  UAE_PASS_DISCOVERY_URL: 'https://stg-id.uaepass.ae/idshub/.well-known/openid-configuration',
  UAE_PASS_CLIENT_ID: 'sp-test',
  UAE_PASS_CLIENT_SECRET: 'shh',
  NEXT_PUBLIC_APP_URL: 'https://app.example.com',
} as unknown as NodeJS.ProcessEnv;

describe('readUaePassConfig', () => {
  it('returns configured=true when discovery, client id, secret, and app url are set', () => {
    const status = readUaePassConfig(baseEnv);
    expect(status.configured).toBe(true);
    expect(status.config).not.toBeNull();
    expect(status.config?.redirectUri).toBe('https://app.example.com/api/auth/uae-pass/callback');
    expect(status.config?.scopes).toEqual(['urn:uae:digitalid:profile:general']);
    expect(status.config?.acrValues).toContain('mobileondemand');
  });

  it('strips a trailing slash from NEXT_PUBLIC_APP_URL when deriving redirect uri', () => {
    const status = readUaePassConfig({ ...baseEnv, NEXT_PUBLIC_APP_URL: 'https://app.example.com/' });
    expect(status.config?.redirectUri).toBe('https://app.example.com/api/auth/uae-pass/callback');
  });

  it('honours UAE_PASS_REDIRECT_URI when provided', () => {
    const status = readUaePassConfig({
      ...baseEnv,
      UAE_PASS_REDIRECT_URI: 'https://custom.example/callback',
    });
    expect(status.config?.redirectUri).toBe('https://custom.example/callback');
  });

  it('returns configured=false when discovery url is missing', () => {
    const env = { ...baseEnv } as NodeJS.ProcessEnv;
    delete env.UAE_PASS_DISCOVERY_URL;
    const status = readUaePassConfig(env);
    expect(status.configured).toBe(false);
    expect(status.reason).toMatch(/UAE_PASS_DISCOVERY_URL/);
  });

  it('returns configured=false when client id is missing', () => {
    const env = { ...baseEnv } as NodeJS.ProcessEnv;
    delete env.UAE_PASS_CLIENT_ID;
    const status = readUaePassConfig(env);
    expect(status.configured).toBe(false);
    expect(status.reason).toMatch(/UAE_PASS_CLIENT_ID/);
  });

  it('returns configured=false when client secret is missing', () => {
    const env = { ...baseEnv } as NodeJS.ProcessEnv;
    delete env.UAE_PASS_CLIENT_SECRET;
    const status = readUaePassConfig(env);
    expect(status.configured).toBe(false);
    expect(status.reason).toMatch(/UAE_PASS_CLIENT_SECRET/);
  });

  it('returns configured=false when neither redirect uri nor app url is set', () => {
    const env = { ...baseEnv } as NodeJS.ProcessEnv;
    delete env.NEXT_PUBLIC_APP_URL;
    const status = readUaePassConfig(env);
    expect(status.configured).toBe(false);
    expect(status.reason).toMatch(/UAE_PASS_REDIRECT_URI|NEXT_PUBLIC_APP_URL/);
  });

  it('parses comma-separated UAE_PASS_SCOPES', () => {
    const status = readUaePassConfig({
      ...baseEnv,
      UAE_PASS_SCOPES: 'urn:uae:digitalid:profile:general, urn:custom:scope',
    });
    expect(status.config?.scopes).toEqual([
      'urn:uae:digitalid:profile:general',
      'urn:custom:scope',
    ]);
  });

  it('rejects an empty UAE_PASS_SCOPES string', () => {
    const status = readUaePassConfig({ ...baseEnv, UAE_PASS_SCOPES: ' , , ' });
    expect(status.configured).toBe(false);
    expect(status.reason).toMatch(/scope/);
  });

  it('treats whitespace-only secrets as not configured', () => {
    const status = readUaePassConfig({ ...baseEnv, UAE_PASS_CLIENT_SECRET: '   ' });
    expect(status.configured).toBe(false);
    expect(status.reason).toMatch(/UAE_PASS_CLIENT_SECRET/);
  });
});
