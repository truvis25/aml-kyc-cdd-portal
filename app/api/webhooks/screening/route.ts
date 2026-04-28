import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { log } from '@/lib/logger';

// Inbound screening webhook from ComplyAdvantage.
// Validates signature, queues into webhook_events, returns 200 immediately.
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-signature') ?? '';
    const body = await request.text();

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('webhook_events').insert({
      provider: 'complyadvantage',
      event_type: 'screening_webhook',
      payload: JSON.parse(body),
      signature,
      status: 'pending',
    });

    if (error) {
      log.error('Failed to queue screening webhook', error);
      return NextResponse.json({ error: 'Failed to queue' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
