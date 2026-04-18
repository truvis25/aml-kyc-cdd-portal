import type { RiskDimensionResult, RiskFactor, RiskInput } from '../risk.types';

// Customer dimension weight in composite score: 30%
const DIMENSION_WEIGHT = 0.30;

const HIGH_RISK_OCCUPATIONS = new Set([
  'money_services',
  'gambling',
  'arms_dealer',
  'cryptocurrency',
  'real_estate',
  'precious_metals',
]);

export function scoreCustomerDimension(input: RiskInput): RiskDimensionResult {
  const factors: RiskFactor[] = [];

  // PEP status (highest weight)
  if (input.pep_status) {
    factors.push({ factor: 'pep_status', score: 85, weight: 0.40, reason: 'Politically Exposed Person' });
  } else {
    factors.push({ factor: 'pep_status', score: 0, weight: 0.40, reason: 'Not a PEP' });
  }

  // Occupation risk
  const occupationLower = (input.occupation ?? '').toLowerCase().replace(/\s+/g, '_');
  const isHighRiskOccupation = HIGH_RISK_OCCUPATIONS.has(occupationLower);
  factors.push({
    factor: 'occupation',
    score: isHighRiskOccupation ? 70 : 10,
    weight: 0.30,
    reason: isHighRiskOccupation ? `High-risk occupation: ${input.occupation}` : 'Standard occupation',
  });

  // Dual nationality
  if (input.dual_nationality) {
    factors.push({ factor: 'dual_nationality', score: 20, weight: 0.15, reason: 'Dual nationality present' });
  } else {
    factors.push({ factor: 'dual_nationality', score: 0, weight: 0.15, reason: 'No dual nationality' });
  }

  // Entity type
  const isCorporate = input.entity_type === 'corporate';
  factors.push({
    factor: 'entity_type',
    score: isCorporate ? 30 : 5,
    weight: 0.15,
    reason: isCorporate ? 'Corporate entity (higher risk)' : 'Individual',
  });

  const score = factors.reduce((sum, f) => sum + f.score * f.weight, 0);

  return { dimension: 'customer', score, weight: DIMENSION_WEIGHT, factors };
}
