import type { ScreeningAdapter, ScreeningParams, ScreeningResult, HitType } from '../screening.types';

function toHitType(raw: string | undefined): HitType {
  if (raw === 'pep' || raw === 'sanction' || raw === 'adverse_media') return raw;
  return 'watchlist';
}

export class ComplyAdvantageAdapter implements ScreeningAdapter {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.complyadvantage.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async submitScreening(params: ScreeningParams): Promise<{ job_id: string }> {
    const response = await fetch(`${this.baseUrl}/searches`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search_term: params.full_name,
        search_type: params.search_type ?? 'PERSON',
        filters: {
          birth_year: params.date_of_birth ? parseInt(params.date_of_birth.split('-')[0] ?? '0', 10) : undefined,
          fuzziness: 0.6,
        },
        tags: [params.tenant_id],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`ComplyAdvantage search failed: ${response.status} ${body}`);
    }

    const data = await response.json();
    return { job_id: String(data.content?.data?.id ?? '') };
  }

  async getResults(job_id: string): Promise<ScreeningResult> {
    const response = await fetch(`${this.baseUrl}/searches/${job_id}`, {
      headers: { 'Authorization': `Token ${this.apiKey}` },
    });

    if (!response.ok) throw new Error(`Failed to fetch screening results: ${response.status}`);

    const data = await response.json();
    const search = data.content?.data;

    const hits = ((search?.hits as Record<string, unknown>[] | undefined) ?? []).map((hit) => ({
      hit_type: toHitType(((hit.doc as Record<string, unknown>)?.types as string[] | undefined)?.[0]),
      match_name: String(hit.match_name ?? ''),
      match_score: Number(hit.score ?? 0) * 100,
      raw_data: hit as Record<string, unknown>,
    }));

    return {
      job_id,
      external_job_id: job_id,
      status: 'completed',
      hits,
      completed_at: new Date().toISOString(),
    };
  }

  async parseWebhook(body: unknown, _signature: string): Promise<ScreeningResult> {
    const payload = body as Record<string, unknown>;
    const search = payload.content as Record<string, unknown>;

    return {
      job_id: String(search?.id ?? ''),
      external_job_id: String(search?.id ?? ''),
      status: 'completed',
      hits: [],
      completed_at: new Date().toISOString(),
    };
  }
}
