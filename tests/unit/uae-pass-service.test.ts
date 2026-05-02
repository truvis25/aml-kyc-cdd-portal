import { describe, expect, it } from 'vitest';
import { isAssuranceAcceptable } from '@/modules/auth/uae-pass/service';

describe('isAssuranceAcceptable', () => {
  it('rejects SOP1 regardless of tenant policy', () => {
    expect(isAssuranceAcceptable('SOP1', 'SOP2')).toBe(false);
    expect(isAssuranceAcceptable('SOP1', 'SOP3')).toBe(false);
  });

  it('rejects VISITOR regardless of tenant policy', () => {
    expect(isAssuranceAcceptable('VISITOR', 'SOP2')).toBe(false);
    expect(isAssuranceAcceptable('VISITOR', 'SOP3')).toBe(false);
  });

  it('accepts SOP3 under any policy', () => {
    expect(isAssuranceAcceptable('SOP3', 'SOP2')).toBe(true);
    expect(isAssuranceAcceptable('SOP3', 'SOP3')).toBe(true);
  });

  it('accepts SOP2 only when tenant policy is SOP2', () => {
    expect(isAssuranceAcceptable('SOP2', 'SOP2')).toBe(true);
    expect(isAssuranceAcceptable('SOP2', 'SOP3')).toBe(false);
  });
});
