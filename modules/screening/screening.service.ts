import * as audit from '@/modules/audit/audit.service';
import { AuditEventType, AuditEntityType } from '@/lib/constants/events';
import { MockScreeningAdapter } from './adapters/MockScreeningAdapter';
import { ComplyAdvantageAdapter } from './adapters/ComplyAdvantageAdapter';
import {
  createScreeningJob,
  updateScreeningJob,
  insertScreeningHits,
  getScreeningJobById,
  getHitsByJobId,
} from './screening.repository';
import type { ScreeningAdapter, ScreeningHit, ScreeningParams } from './screening.types';
import { getLatestTenantConfig } from '@/modules/admin-config/admin-config.service';

function getAdapter(): ScreeningAdapter {
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv !== 'production') {
    return new MockScreeningAdapter();
  }
  const key = process.env.COMPLY_ADVANTAGE_API_KEY;
  if (!key) throw new Error('COMPLY_ADVANTAGE_API_KEY is not set');
  return new ComplyAdvantageAdapter(key);
}

/**
 * Drops adverse-media hits whose match_score is below the tenant's
 * configured confidence threshold. Sanctions, PEP, and other watchlist
 * hits are NOT subject to this filter — they always surface regardless
 * of score, because a low-confidence sanctions match still warrants
 * analyst review.
 */
export function filterAdverseMediaByConfidence(
  hits: ScreeningHit[],
  minConfidence: number,
): ScreeningHit[] {
  return hits.filter((h) => {
    if (h.hit_type !== 'adverse_media') return true;
    return (h.match_score ?? 0) >= minConfidence;
  });
}

export async function initiateScreening(
  params: ScreeningParams,
  actor_id: string
): Promise<{ job_id: string }> {
  const adapter = getAdapter();
  const provider = process.env.NODE_ENV === 'production' ? 'complyadvantage' : 'mock';

  // Resolve adverse-media policy from tenant config unless the caller has
  // already set the flag explicitly (e.g. ad-hoc re-screen with overrides).
  // Default-on semantics live in DEFAULT_TENANT_CONFIG (§11.8).
  const config = await getLatestTenantConfig(params.tenant_id);
  const adverseMediaEnabled =
    params.adverse_media_enabled ?? config.config.screening.adverse_media_enabled;
  const adverseMediaMinConfidence = config.config.screening.adverse_media_min_confidence;

  const job = await createScreeningJob({
    tenant_id: params.tenant_id,
    customer_id: params.customer_id,
    provider,
    requested_by: actor_id,
  });

  await audit.emit({
    tenant_id: params.tenant_id,
    event_type: AuditEventType.SCREENING_INITIATED,
    entity_type: AuditEntityType.SCREENING_JOB,
    entity_id: job.id,
    actor_id,
    payload: {
      customer_id: params.customer_id,
      provider,
      adverse_media_enabled: adverseMediaEnabled,
      adverse_media_min_confidence: adverseMediaMinConfidence,
    },
  });

  // Submit async — results come back via webhook or polling
  adapter
    .submitScreening({ ...params, adverse_media_enabled: adverseMediaEnabled })
    .then(async ({ job_id: externalId }) => {
      await updateScreeningJob(job.id, params.tenant_id, 'running', externalId);
      const result = await adapter.getResults(externalId);
      await updateScreeningJob(job.id, params.tenant_id, 'completed');
      const filtered = filterAdverseMediaByConfidence(result.hits, adverseMediaMinConfidence);
      await insertScreeningHits(job.id, params.customer_id, params.tenant_id, filtered);
    })
    .catch(async () => {
      await updateScreeningJob(job.id, params.tenant_id, 'failed');
    });

  return { job_id: job.id };
}

export async function getScreeningResults(job_id: string, tenant_id: string) {
  const job = await getScreeningJobById(job_id, tenant_id);
  if (!job) throw new Error('Screening job not found');

  const hits = await getHitsByJobId(job_id, tenant_id);
  return { job, hits };
}
