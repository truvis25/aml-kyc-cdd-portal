import type { RiskDimensionResult, RiskFactor, RiskInput } from '../risk.types';
import { FATF_HIGH_RISK, FATF_MONITORED } from '../risk.types';

// Geographic dimension weight in composite score: 25%
const DIMENSION_WEIGHT = 0.25;

export function scoreGeographicDimension(input: RiskInput): RiskDimensionResult {
  const factors: RiskFactor[] = [];

  const residence = (input.country_of_residence ?? '').toUpperCase();
  const nationality = (input.nationality ?? '').toUpperCase();

  // Country of residence risk
  let residenceScore = 10;
  let residenceReason = 'Standard jurisdiction';
  if (FATF_HIGH_RISK.has(residence)) {
    residenceScore = 100;
    residenceReason = `FATF high-risk jurisdiction: ${residence}`;
  } else if (FATF_MONITORED.has(residence)) {
    residenceScore = 65;
    residenceReason = `FATF monitored jurisdiction: ${residence}`;
  }
  factors.push({ factor: 'country_of_residence', score: residenceScore, weight: 0.50, reason: residenceReason });

  // Nationality risk
  let nationalityScore = 10;
  let nationalityReason = 'Standard nationality';
  if (FATF_HIGH_RISK.has(nationality)) {
    nationalityScore = 100;
    nationalityReason = `FATF high-risk nationality: ${nationality}`;
  } else if (FATF_MONITORED.has(nationality)) {
    nationalityScore = 65;
    nationalityReason = `FATF monitored nationality: ${nationality}`;
  }
  factors.push({ factor: 'nationality', score: nationalityScore, weight: 0.50, reason: nationalityReason });

  const score = factors.reduce((sum, f) => sum + f.score * f.weight, 0);

  return { dimension: 'geographic', score, weight: DIMENSION_WEIGHT, factors };
}
