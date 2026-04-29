/**
 * POST /api/lead
 *
 * Public marketing lead capture. Accepts JSON, validates with Zod, inserts a
 * row into `marketing_leads`, and (best-effort) emails the sales inbox.
 *
 * Not tenant-scoped, no auth required. The `marketing_leads` RLS policy
 * permits anon INSERT — see migration 0033.
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { MarketingLeadSchema } from '@/lib/validations/marketingLead';
import { createLead } from '@/modules/marketing-leads';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
// Always run on each request — no static caching for a form endpoint.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = MarketingLeadSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      // Return field-level errors so the client form can render them.
      const fieldErrors: Record<string, string> = {};
      for (const issue of err.issues) {
        const key = issue.path.join('.') || '_';
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return NextResponse.json({ error: 'validation_failed', fieldErrors }, { status: 400 });
    }
    log.error('[api/lead] unexpected validation error', { code: 'validation_threw' });
    return NextResponse.json({ error: 'validation_failed' }, { status: 400 });
  }

  // Honeypot: if the hidden `website` field has any content, silently 200 so
  // bots can't tell they were rejected.
  if (parsed.website && parsed.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const result = await createLead(parsed);

  if (!result.ok) {
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
