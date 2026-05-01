import { test, expect } from '@playwright/test';

/**
 * Confirms the security headers configured in next.config.ts are actually sent
 * in production responses. These are non-negotiable for a financial-platform
 * SaaS — regressions here are exactly what an inspector would flag.
 */

test('security headers present on the landing response', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);

  const headers = res.headers();

  expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['strict-transport-security']).toMatch(/max-age=\d+/);
  expect(headers['permissions-policy']).toContain('camera=()');
  // poweredByHeader: false → no x-powered-by leakage
  expect(headers['x-powered-by']).toBeUndefined();
});
