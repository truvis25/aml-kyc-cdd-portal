import * as audit from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import { scoreCustomerDimension } from './dimensions/customer.dimension';
import { scoreGeographicDimension } from './dimensions/geographic.dimension';
import { scoreProductDimension } from './dimensions/product.dimension';
import { insertRiskAssessment, getLatestRiskAssessment } from './risk.repository';
import type { RiskBand, RiskInput, RiskAssessment } from './risk.types';

function determineBand(score: number): RiskBand {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'high';
  return 'unacceptable';
}

export async function computeRiskScore(
  customer_id: string,
  tenant_id: string,
  input: RiskInput,
  actor_id: string
): Promise<RiskAssessment> {
  const customerDim = scoreCustomerDimension(input);
  const geographicDim = scoreGeographicDimension(input);
  const productDim = scoreProductDimension(input);

  const remainingWeight = 1 - customerDim.weight - geographicDim.weight - productDim.weight;
  const composite_score = Math.round(
    customerDim.score * customerDim.weight +
    geographicDim.score * geographicDim.weight +
    productDim.score * productDim.weight +
    10 * remainingWeight
  );

  const risk_band = determineBand(composite_score);

  const assessment = await insertRiskAssessment({
    tenant_id,
    customer_id,
    composite_score,
    risk_band,
    customer_score: Math.round(customerDim.score),
    geographic_score: Math.round(geographicDim.score),
    product_score: Math.round(productDim.score),
    factor_breakdown: {
      customer: customerDim,
      geographic: geographicDim,
      product: productDim,
    },
    version: 1,
    assessed_by: actor_id,
  });

  await audit.emit({
    tenant_id,
    event_type: AuditEventType.RISK_SCORE_COMPUTED,
    entity_type: AuditEntityType.RISK_ASSESSMENT,
    entity_id: assessment.id,
    actor_id,
    payload: { customer_id, composite_score, risk_band },
  });

  return assessment;
}

export async function getLatestAssessment(customer_id: string, tenant_id: string) {
  return getLatestRiskAssessment(customer_id, tenant_id);
}
