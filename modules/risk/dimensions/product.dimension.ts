import type { RiskDimensionResult, RiskFactor, RiskInput } from '../risk.types';

// Product dimension weight in composite score: 20%
const DIMENSION_WEIGHT = 0.20;

const HIGH_RISK_PRODUCTS = new Set(['cryptocurrency', 'offshore_investment', 'private_banking', 'correspondent_banking']);
const HIGH_VOLUME_THRESHOLD = 'over_500k';

export function scoreProductDimension(input: RiskInput): RiskDimensionResult {
  const factors: RiskFactor[] = [];

  // Product type
  const product = (input.product_type ?? 'standard').toLowerCase();
  const isHighRiskProduct = HIGH_RISK_PRODUCTS.has(product);
  factors.push({
    factor: 'product_type',
    score: isHighRiskProduct ? 75 : 10,
    weight: 0.60,
    reason: isHighRiskProduct ? `High-risk product: ${product}` : 'Standard product',
  });

  // Expected transaction volume
  const volume = input.expected_transaction_volume ?? 'under_50k';
  const isHighVolume = volume === HIGH_VOLUME_THRESHOLD || volume === '100k_500k';
  factors.push({
    factor: 'expected_transaction_volume',
    score: volume === HIGH_VOLUME_THRESHOLD ? 70 : isHighVolume ? 40 : 10,
    weight: 0.40,
    reason: `Expected volume: ${volume}`,
  });

  const score = factors.reduce((sum, f) => sum + f.score * f.weight, 0);

  return { dimension: 'product', score, weight: DIMENSION_WEIGHT, factors };
}
