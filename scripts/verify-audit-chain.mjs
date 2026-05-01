#!/usr/bin/env node
/**
 * Walks every tenant's audit_log chain and reports any tampering.
 *
 * Calls the server-side `verify_audit_chain(tenant_id)` Postgres function
 * (see migration 0037), so the hash recomputation logic lives in one
 * place. This script is the operator-facing entrypoint — used in
 * RUNBOOK.md (post-incident verification) and as a recurring sanity
 * check (cron / GitHub Action / manual).
 *
 * Usage:
 *   node scripts/verify-audit-chain.mjs              # all tenants
 *   node scripts/verify-audit-chain.mjs <tenant_id>  # one tenant
 *   node scripts/verify-audit-chain.mjs --json       # machine-readable
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL.
 *
 * Exit codes:
 *   0 — every chain is OK
 *   1 — at least one tenant has TAMPERED_HASH or BROKEN_CHAIN rows
 *   2 — runtime error (env, network, etc.)
 */

import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const tenantArg = args.find((a) => a !== '--json');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in env.',
  );
  process.exit(2);
}

const sb = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Returns the list of tenant_ids to verify. If the user passed one as
 * argv we trust it; otherwise we enumerate the tenants table.
 */
async function listTenants() {
  if (tenantArg) return [tenantArg];
  const { data, error } = await sb.from('tenants').select('id, slug').order('slug');
  if (error) {
    console.error('Failed to list tenants:', error.message);
    process.exit(2);
  }
  return data;
}

/**
 * Calls the verify_audit_chain Postgres function for a tenant and
 * returns the per-row verification report.
 */
async function verifyTenant(tenantId) {
  const { data, error } = await sb.rpc('verify_audit_chain', {
    p_tenant_id: tenantId,
  });
  if (error) throw new Error(`verify_audit_chain failed: ${error.message}`);
  return data ?? [];
}

const summary = {
  total_tenants: 0,
  total_rows: 0,
  ok_rows: 0,
  broken_chain_rows: 0,
  tampered_hash_rows: 0,
  failing_tenants: [],
};

const tenants = await listTenants();
const tenantList = Array.isArray(tenants) ? tenants : [];
summary.total_tenants = tenantList.length;

for (const t of tenantList) {
  const tenantId = typeof t === 'string' ? t : t.id;
  const tenantLabel = typeof t === 'string' ? t : `${t.slug ?? '?'} (${t.id})`;

  let report;
  try {
    report = await verifyTenant(tenantId);
  } catch (err) {
    if (jsonMode) {
      console.error(JSON.stringify({ tenant: tenantId, error: err.message }));
    } else {
      console.error(`✗ ${tenantLabel}: ${err.message}`);
    }
    summary.failing_tenants.push(tenantId);
    continue;
  }

  summary.total_rows += report.length;
  const broken = report.filter((r) => r.status !== 'OK');
  summary.ok_rows += report.length - broken.length;
  summary.broken_chain_rows += broken.filter(
    (r) => r.status === 'BROKEN_CHAIN',
  ).length;
  summary.tampered_hash_rows += broken.filter(
    (r) => r.status === 'TAMPERED_HASH',
  ).length;

  if (broken.length > 0) {
    summary.failing_tenants.push(tenantId);
    if (!jsonMode) {
      console.error(
        `✗ ${tenantLabel}: ${broken.length} of ${report.length} rows failed verification`,
      );
      for (const r of broken.slice(0, 10)) {
        console.error(
          `    ${r.row_id} @ ${r.event_time}  status=${r.status}`,
        );
      }
      if (broken.length > 10) {
        console.error(`    … and ${broken.length - 10} more`);
      }
    }
  } else if (!jsonMode) {
    console.log(`✓ ${tenantLabel}: ${report.length} rows OK`);
  }
}

if (jsonMode) {
  console.log(JSON.stringify(summary, null, 2));
}

const failed =
  summary.broken_chain_rows + summary.tampered_hash_rows + summary.failing_tenants.length > 0;

if (!jsonMode) {
  console.log('');
  console.log(
    `Summary: ${summary.ok_rows}/${summary.total_rows} OK across ${summary.total_tenants} tenant(s).`,
  );
  if (failed) {
    console.error(
      `Failures: ${summary.broken_chain_rows} broken-chain, ${summary.tampered_hash_rows} tampered-hash, ${summary.failing_tenants.length} tenant(s) with issues.`,
    );
  }
}

process.exit(failed ? 1 : 0);
