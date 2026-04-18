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
import type { ScreeningAdapter, ScreeningParams } from './screening.types';

function getAdapter(): ScreeningAdapter {
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv !== 'production') {
    return new MockScreeningAdapter();
  }
  const key = process.env.COMPLY_ADVANTAGE_API_KEY;
  if (!key) throw new Error('COMPLY_ADVANTAGE_API_KEY is not set');
  return new ComplyAdvantageAdapter(key);
}

export async function initiateScreening(
  params: ScreeningParams,
  actor_id: string
): Promise<{ job_id: string }> {
  const adapter = getAdapter();
  const provider = process.env.NODE_ENV === 'production' ? 'complyadvantage' : 'mock';

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
    payload: { customer_id: params.customer_id, provider },
  });

  // Submit async — results come back via webhook or polling
  adapter.submitScreening(params).then(async ({ job_id: externalId }) => {
    await updateScreeningJob(job.id, params.tenant_id, 'running', externalId);
    const result = await adapter.getResults(externalId);
    await updateScreeningJob(job.id, params.tenant_id, 'completed');
    await insertScreeningHits(job.id, params.customer_id, params.tenant_id, result.hits);
  }).catch(async () => {
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
