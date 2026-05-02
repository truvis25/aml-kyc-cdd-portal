import { describe, expect, it } from 'vitest';
import { mergeWithDefaults } from '@/modules/admin-config/admin-config.service';
import { DEFAULT_TENANT_CONFIG } from '@/modules/admin-config/types';

describe('mergeWithDefaults', () => {
  it('returns a fresh defaults object when given null', () => {
    expect(mergeWithDefaults(null)).toEqual(DEFAULT_TENANT_CONFIG);
  });

  it('returns a fresh defaults object when given undefined', () => {
    expect(mergeWithDefaults(undefined)).toEqual(DEFAULT_TENANT_CONFIG);
  });

  it('preserves user-provided fields and fills in defaults for missing keys', () => {
    const out = mergeWithDefaults({
      modules: {
        individual_kyc: false,
        corporate_kyb: true,
        edd_enabled: true,
        ongoing_screening: false,
      },
    });
    expect(out.modules.individual_kyc).toBe(false);
    // Defaults filled in for non-modules groups.
    expect(out.documents).toEqual(DEFAULT_TENANT_CONFIG.documents);
    expect(out.risk_thresholds).toEqual(DEFAULT_TENANT_CONFIG.risk_thresholds);
    expect(out.branding).toEqual(DEFAULT_TENANT_CONFIG.branding);
  });

  it('merges per-group: missing keys inside a group fall back to defaults', () => {
    // Older stored row only has `company_name` — logo_url key is absent and
    // should come from defaults via the spread merge.
    const out = mergeWithDefaults({
      branding: { company_name: 'Acme Bank' } as Partial<
        typeof DEFAULT_TENANT_CONFIG.branding
      > as never,
    });
    expect(out.branding.company_name).toBe('Acme Bank');
    expect(out.branding.logo_url).toBe(DEFAULT_TENANT_CONFIG.branding.logo_url);
  });

  it('keeps unknown flags object intact and merges with defaults', () => {
    const out = mergeWithDefaults({ flags: { custom_flag: true } });
    expect(out.flags.custom_flag).toBe(true);
  });

  it('does not mutate the input', () => {
    const stored = { modules: { individual_kyc: false } } as Parameters<
      typeof mergeWithDefaults
    >[0];
    const before = JSON.stringify(stored);
    mergeWithDefaults(stored);
    expect(JSON.stringify(stored)).toBe(before);
  });

  // §11.8: adverse media is default-ON at 85% confidence. Older config rows
  // written before migration 0030 land here without a `screening` group at
  // all — they must transparently inherit the default-on policy.
  it('fills in screening defaults for legacy rows missing the screening group', () => {
    const out = mergeWithDefaults({
      modules: {
        individual_kyc: true,
        corporate_kyb: true,
        edd_enabled: true,
        ongoing_screening: false,
      },
    });
    expect(out.screening.adverse_media_enabled).toBe(true);
    expect(out.screening.adverse_media_min_confidence).toBe(85);
  });

  it('preserves explicit screening overrides', () => {
    const out = mergeWithDefaults({
      screening: {
        adverse_media_enabled: false,
        adverse_media_min_confidence: 60,
      },
    });
    expect(out.screening.adverse_media_enabled).toBe(false);
    expect(out.screening.adverse_media_min_confidence).toBe(60);
  });

  it('per-screening-key merge: partial override keeps the other key default', () => {
    const out = mergeWithDefaults({
      screening: { adverse_media_min_confidence: 70 } as Partial<
        typeof DEFAULT_TENANT_CONFIG.screening
      > as never,
    });
    expect(out.screening.adverse_media_min_confidence).toBe(70);
    expect(out.screening.adverse_media_enabled).toBe(
      DEFAULT_TENANT_CONFIG.screening.adverse_media_enabled,
    );
  });
});
