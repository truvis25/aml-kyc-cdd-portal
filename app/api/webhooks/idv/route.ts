import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Inbound IDV webhook from Sumsub.
// Validates signature, queues into webhook_events, returns 200 immediately.
// Edge Function processes the queue asynchronously.
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-payload-digest') ?? '';
    const body = await request.text();

    // Minimal signature check — full HMAC-SHA1 validation in Edge Function
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('webhook_events').insert({
      provider: 'sumsub',
      event_type: 'idv_webhook',
      payload: JSON.parse(body),
      signature,
      status: 'pending',
    });

    if (error) {
      console.error('Failed to queue IDV webhook:', error.message);
      return NextResponse.json({ error: 'Failed to queue' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
