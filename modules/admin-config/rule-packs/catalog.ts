/**
 * Rule-pack catalog — UAE regulator-aligned workflow templates.
 *
 * Source of truth for the *metadata* shown in the admin UI (Settings →
 * Workflows → Templates). The actual workflow_definitions rows are
 * seeded by migration 0040_seed_regulator_rule_packs.sql; this catalog
 * just maps each seeded pack to display copy + a static description so
 * the page can render without parsing the JSONB.
 *
 * Adding a new pack:
 *   1. Add a new row to migration 0040 (or a follow-up migration)
 *   2. Add a matching entry below
 *   3. Wire it in the admin UI (it auto-appears via the catalog list)
 *
 * Source: PRD v1.0 §8.3 (Industry Template Library) + §9.3
 *         (Jurisdiction-specific design notes) + FINAL_LAUNCH_PLAN §2.8.
 */

export type Regulator = 'DFSA' | 'FSRA' | 'CBUAE' | 'MOE';
export type Jurisdiction = 'DIFC' | 'ADGM' | 'UAE Federal' | 'UAE Federal — DNFBP';

export interface RulePack {
  /** UUID of the corresponding row in workflow_definitions. */
  id: string;
  /** The workflow_definitions.name slug. Stable; UI does not display this. */
  name: string;
  /** Human-readable display title. */
  display_name: string;
  /** Short subtitle for the catalog card. */
  tagline: string;
  /** Regulator code. */
  regulator: Regulator;
  /** Full regulator name for the regulator-info row. */
  regulator_full_name: string;
  /** Jurisdiction the pack is designed for. */
  jurisdiction: Jurisdiction;
  /** Customer type the pack targets. v1 is individual-only. */
  customer_type: 'individual' | 'corporate';
  /** Marketing-oriented bullet list highlighting what this pack adds vs the platform default. */
  highlights: string[];
  /** Statutory retention floor enforced by this regulator. */
  retention_min_years: number;
  /** Whether Simplified Due Diligence is permitted under this regulator's rules. */
  sdd_permitted: boolean;
}

export const RULE_PACKS: readonly RulePack[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    name: 'dfsa-individual-kyc-v1',
    display_name: 'DFSA — Individual KYC',
    tagline: 'DIFC-licensed financial firms',
    regulator: 'DFSA',
    regulator_full_name: 'Dubai Financial Services Authority',
    jurisdiction: 'DIFC',
    customer_type: 'individual',
    retention_min_years: 5,
    sdd_permitted: false,
    highlights: [
      'No Simplified CDD permitted (DFSA AML Module §AML-3)',
      'DIFC PDPL 2020 consent architecture',
      'English-law jurisdiction declaration',
      'Tax residency certificate required (CRS)',
      'Stricter EDD triggers for high-risk indicators',
    ],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    name: 'fsra-individual-kyc-v1',
    display_name: 'FSRA — Individual KYC',
    tagline: 'ADGM-regulated entities',
    regulator: 'FSRA',
    regulator_full_name: 'Financial Services Regulatory Authority',
    jurisdiction: 'ADGM',
    customer_type: 'individual',
    retention_min_years: 6,
    sdd_permitted: false,
    highlights: [
      'ADGM AML/CFT Rules 2019 baseline',
      'ADGM DPR 2021 consent architecture',
      'English common-law jurisdiction',
      'Designed to feed downstream KYB with ADGM entity-type metadata (Foundations, RSCs)',
      'No Simplified CDD permitted',
    ],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    name: 'cbuae-mainland-individual-kyc-v1',
    display_name: 'CBUAE Mainland — Individual KYC',
    tagline: 'UAE Federal-licensed financial institutions',
    regulator: 'CBUAE',
    regulator_full_name: 'Central Bank of the UAE',
    jurisdiction: 'UAE Federal',
    customer_type: 'individual',
    retention_min_years: 5,
    sdd_permitted: false,
    highlights: [
      'UAE Federal Decree-Law No. 20 of 2019 baseline',
      'UAE PDPL 2021 consent architecture',
      'goAML STR disclosure pre-wired',
      '5-year retention floor',
      'Emirates ID accepted as primary ID for UAE residents',
    ],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    name: 'dnfbp-individual-kyc-v1',
    display_name: 'DNFBP — Individual KYC',
    tagline: 'CSPs, real estate, gold dealers, law firms',
    regulator: 'MOE',
    regulator_full_name: 'UAE Ministry of Economy (DNFBP supervisor)',
    jurisdiction: 'UAE Federal — DNFBP',
    customer_type: 'individual',
    retention_min_years: 5,
    sdd_permitted: false,
    highlights: [
      'Mandatory MLRO acknowledgement (UAE AML Law)',
      'goAML registration disclosure',
      'DNFBP-specific AML policy attestation at consent',
      'Sector-aware risk weighting (real-estate, precious metals, CSPs)',
      'UAE PDPL 2021 consent architecture',
    ],
  },
];

/** Lookup by workflow_definitions.id. */
export function getRulePackById(id: string): RulePack | undefined {
  return RULE_PACKS.find((p) => p.id === id);
}

/** Lookup by workflow name slug. */
export function getRulePackByName(name: string): RulePack | undefined {
  return RULE_PACKS.find((p) => p.name === name);
}

/** True if the workflow_definitions row corresponds to a known platform-level pack. */
export function isRulePack(id: string): boolean {
  return getRulePackById(id) !== undefined;
}
