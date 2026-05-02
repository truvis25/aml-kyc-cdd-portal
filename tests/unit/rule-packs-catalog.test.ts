import { describe, expect, it } from 'vitest';
import {
  RULE_PACKS,
  getRulePackById,
  getRulePackByName,
  isRulePack,
  type RulePack,
} from '@/modules/admin-config/rule-packs/catalog';

/**
 * Sanity coverage for the rule-pack catalog. The catalog is the source of
 * truth shown to operators in the Workflows admin UI; the ID values must
 * match the seed in supabase/migrations/0040_seed_regulator_rule_packs.sql,
 * because the clone API looks them up by id.
 */

const SEED_IDS_FROM_MIGRATION_0040 = [
  'b0000000-0000-0000-0000-000000000001', // DFSA
  'b0000000-0000-0000-0000-000000000002', // FSRA
  'b0000000-0000-0000-0000-000000000003', // CBUAE
  'b0000000-0000-0000-0000-000000000004', // DNFBP
];

describe('RULE_PACKS catalog', () => {
  it('contains exactly the four v1 packs', () => {
    expect(RULE_PACKS).toHaveLength(4);
    const ids = RULE_PACKS.map((p) => p.id).sort();
    expect(ids).toEqual([...SEED_IDS_FROM_MIGRATION_0040].sort());
  });

  it('each pack has the four required regulators covered', () => {
    const regs = RULE_PACKS.map((p) => p.regulator).sort();
    expect(regs).toEqual(['CBUAE', 'DFSA', 'FSRA', 'MOE']);
  });

  it('each pack targets individual KYC in v1 (corporate variants deferred)', () => {
    for (const pack of RULE_PACKS) {
      expect(pack.customer_type).toBe('individual');
    }
  });

  it('every pack disables Simplified Due Diligence per UAE regulator rules', () => {
    for (const pack of RULE_PACKS) {
      expect(pack.sdd_permitted).toBe(false);
    }
  });

  it('every pack enforces a 5-year retention floor or longer', () => {
    for (const pack of RULE_PACKS) {
      expect(pack.retention_min_years).toBeGreaterThanOrEqual(5);
    }
  });

  it('every pack has at least three highlights so the catalog card renders meaningfully', () => {
    for (const pack of RULE_PACKS) {
      expect(pack.highlights.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('display_name and tagline are non-empty for every pack', () => {
    for (const pack of RULE_PACKS) {
      expect(pack.display_name.length).toBeGreaterThan(0);
      expect(pack.tagline.length).toBeGreaterThan(0);
    }
  });

  it('IDs are unique across the catalog', () => {
    const ids = RULE_PACKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('name slugs are unique across the catalog', () => {
    const names = RULE_PACKS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('getRulePackById', () => {
  it('returns the pack for each known seed id', () => {
    for (const id of SEED_IDS_FROM_MIGRATION_0040) {
      const pack = getRulePackById(id);
      expect(pack).toBeDefined();
      expect(pack?.id).toBe(id);
    }
  });

  it('returns undefined for unknown ids', () => {
    expect(getRulePackById('00000000-0000-0000-0000-000000000000')).toBeUndefined();
    expect(getRulePackById('not-a-uuid')).toBeUndefined();
  });
});

describe('getRulePackByName', () => {
  it('returns the DFSA pack by its known slug', () => {
    const pack = getRulePackByName('dfsa-individual-kyc-v1') as RulePack | undefined;
    expect(pack?.regulator).toBe('DFSA');
  });

  it('returns undefined for unknown slug', () => {
    expect(getRulePackByName('nonexistent-pack-v1')).toBeUndefined();
  });
});

describe('isRulePack', () => {
  it('returns true for every seeded id', () => {
    for (const id of SEED_IDS_FROM_MIGRATION_0040) {
      expect(isRulePack(id)).toBe(true);
    }
  });

  it('returns false for ids that are not in the catalog', () => {
    // The original platform-default workflow lives at id a0000000-... and
    // is NOT a rule pack; the clone endpoint must reject it.
    expect(isRulePack('a0000000-0000-0000-0000-000000000001')).toBe(false);
    expect(isRulePack('00000000-0000-0000-0000-000000000000')).toBe(false);
  });
});
