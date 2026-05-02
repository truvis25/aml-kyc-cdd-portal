import { describe, expect, it } from 'vitest';
import { filterAdverseMediaByConfidence } from '@/modules/screening/screening.service';
import type { ScreeningHit } from '@/modules/screening/screening.types';

/**
 * Regression coverage for FINAL_LAUNCH_PLAN §11.8: the adverse-media
 * confidence filter must drop low-score adverse_media hits but never
 * touch sanctions / PEP / watchlist hits, regardless of their score.
 */

function hit(overrides: Partial<ScreeningHit> = {}): ScreeningHit {
  return {
    hit_type: 'adverse_media',
    match_name: 'Test Subject',
    match_score: 50,
    raw_data: {},
    ...overrides,
  };
}

describe('filterAdverseMediaByConfidence', () => {
  it('drops adverse_media hits below the threshold', () => {
    const out = filterAdverseMediaByConfidence(
      [hit({ match_score: 80 }), hit({ match_score: 95 })],
      85,
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.match_score).toBe(95);
  });

  it('keeps adverse_media hits exactly at the threshold', () => {
    const out = filterAdverseMediaByConfidence([hit({ match_score: 85 })], 85);
    expect(out).toHaveLength(1);
  });

  it('treats missing/null match_score as zero (drops the hit)', () => {
    const out = filterAdverseMediaByConfidence(
      [hit({ match_score: null as unknown as number })],
      50,
    );
    expect(out).toHaveLength(0);
  });

  it('never drops sanctions hits regardless of score', () => {
    const out = filterAdverseMediaByConfidence(
      [hit({ hit_type: 'sanction', match_score: 5 })],
      99,
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.hit_type).toBe('sanction');
  });

  it('never drops PEP hits regardless of score', () => {
    const out = filterAdverseMediaByConfidence(
      [hit({ hit_type: 'pep', match_score: 0 })],
      99,
    );
    expect(out).toHaveLength(1);
  });

  it('never drops watchlist hits regardless of score', () => {
    const out = filterAdverseMediaByConfidence(
      [hit({ hit_type: 'watchlist', match_score: 1 })],
      99,
    );
    expect(out).toHaveLength(1);
  });

  it('preserves order of the kept hits', () => {
    const out = filterAdverseMediaByConfidence(
      [
        hit({ match_name: 'A', hit_type: 'sanction', match_score: 0 }),
        hit({ match_name: 'B', hit_type: 'adverse_media', match_score: 30 }),
        hit({ match_name: 'C', hit_type: 'pep', match_score: 100 }),
        hit({ match_name: 'D', hit_type: 'adverse_media', match_score: 90 }),
      ],
      85,
    );
    expect(out.map((h) => h.match_name)).toEqual(['A', 'C', 'D']);
  });

  it('threshold of 0 keeps every hit', () => {
    const hits = [
      hit({ hit_type: 'adverse_media', match_score: 1 }),
      hit({ hit_type: 'adverse_media', match_score: 50 }),
    ];
    expect(filterAdverseMediaByConfidence(hits, 0)).toHaveLength(2);
  });

  it('empty input returns empty output', () => {
    expect(filterAdverseMediaByConfidence([], 85)).toEqual([]);
  });
});
