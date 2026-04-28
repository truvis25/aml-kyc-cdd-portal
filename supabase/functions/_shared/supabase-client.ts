// Service-role Supabase client for Edge Functions.
// Bypasses RLS — never expose any path that returns this client to
// untrusted input. Functions in supabase/functions/ are the only place
// the service-role key lives outside the Vercel API routes.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export function createServiceRoleClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the function environment',
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
