/**
 * Idempotency helpers for outbound notifications and side-effects.
 *
 * Callers pass their own Supabase client so this lib stays import-clean.
 * In app/api/ route handlers, pass the admin client for system-level access.
 *
 * Requires an `idempotency_keys` table:
 *   id         uuid  primary key default gen_random_uuid()
 *   key        text  unique not null
 *   created_at timestamptz default now()
 *   expires_at timestamptz not null
 *
 * Add it via a Supabase migration if not already present.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Wraps an outbound side-effect in an idempotency check.
 *
 * If a non-expired key already exists, `fn` is skipped and null is returned.
 * Otherwise the key is created, `fn` is called, and its result returned.
 */
export async function withIdempotency<T>(
  supabase: SupabaseClient,
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T | null> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlMs)

  // Check for an existing, non-expired key
  const { data: existing } = await supabase
    .from('idempotency_keys')
    .select('expires_at')
    .eq('key', key)
    .single()

  if (existing) {
    if (new Date(existing.expires_at as string) > now) {
      return null
    }
    await supabase.from('idempotency_keys').delete().eq('key', key)
  }

  // Insert the key — unique constraint handles concurrent race
  const { error: insertError } = await supabase
    .from('idempotency_keys')
    .insert({ key, expires_at: expiresAt.toISOString() })

  if (insertError) {
    // Another concurrent caller won the race — treat as already-processed
    if (insertError.code === '23505') return null
    throw insertError
  }

  try {
    return await fn()
  } catch (err) {
    await supabase.from('idempotency_keys').delete().eq('key', key).then(() => undefined)
    throw err
  }
}

/**
 * Build a canonical idempotency key from parts. Parts are joined with `:` and
 * any colons within a part are escaped to prevent collisions.
 */
export function buildIdempotencyKey(...parts: (string | number)[]): string {
  return parts.map((p) => String(p).replace(/:/g, '_')).join(':')
}
