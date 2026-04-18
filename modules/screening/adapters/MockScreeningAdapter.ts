import type { ScreeningAdapter, ScreeningParams, ScreeningResult } from '../screening.types';

// Default adapter in development and test environments.
// Returns deterministic results based on the customer's name for predictable testing.
export class MockScreeningAdapter implements ScreeningAdapter {
  async submitScreening(params: ScreeningParams): Promise<{ job_id: string }> {
    return { job_id: `mock-job-${params.customer_id}` };
  }

  async getResults(job_id: string): Promise<ScreeningResult> {
    // Simulate a PEP hit if the job_id contains 'pep' (for testing purposes)
    const hasPepHit = job_id.includes('pep');
    return {
      job_id,
      external_job_id: `ext-${job_id}`,
      status: 'completed',
      hits: hasPepHit
        ? [
            {
              hit_type: 'pep',
              match_name: 'Test PEP Match',
              match_score: 87.5,
              raw_data: { list: 'mock-pep-list', country: 'AE' },
            },
          ]
        : [],
      completed_at: new Date().toISOString(),
    };
  }

  async parseWebhook(_body: unknown, _signature: string): Promise<ScreeningResult> {
    return {
      job_id: 'mock-webhook-job',
      status: 'completed',
      hits: [],
      completed_at: new Date().toISOString(),
    };
  }
}
