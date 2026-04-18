/**
 * Admin Supabase client using SERVICE_ROLE_KEY.
 *
 * ⚠️  SECURITY: This client bypasses Row Level Security.
 *
 * ALLOWED: supabase/functions/** (Edge Functions)
 * NOT ALLOWED: app/** — importing this file in any app/ code is a critical security violation.
 *
 * The ESLint rule no-restricted-imports should be configured to block this.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

let adminClient: ReturnType<typeof createClient<Database>> | undefined;

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Admin client is only available in Edge Functions.'
    );
  }
  if (!adminClient) {
    adminClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return adminClient;
}
