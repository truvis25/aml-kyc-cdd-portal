#!/usr/bin/env node
/**
 * Environment variable validation script.
 * Run before starting the app or in CI to catch missing configuration early.
 *
 * Usage:
 *   node scripts/check-env.mjs           — checks current process.env
 *   npm run validate:env                  — same, via package.json script
 */

const VARS = [
  // ─── Required in all environments ────────────────────────────────────────
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    public: true,
    description: 'Supabase project URL (Project Settings → API → Project URL)',
    validate: (v) => v.startsWith('https://') && v.includes('.supabase'),
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    public: true,
    description: 'Supabase anon/public key (Project Settings → API → anon public)',
    validate: (v) => v.startsWith('eyJ'),
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    public: false,
    description: 'Supabase service role key — SERVER ONLY, never expose to browser',
    validate: (v) => v.startsWith('eyJ'),
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    public: true,
    description: 'Application base URL (e.g. https://app.truvis.io)',
    validate: (v) => v.startsWith('http'),
  },
];

let hasErrors = false;
let hasWarnings = false;

console.log('\nEnvironment variable check\n' + '─'.repeat(50));

for (const v of VARS) {
  const value = process.env[v.name];
  const label = v.public ? '[public]' : '[secret]';

  if (!value) {
    console.error(`  ✗ MISSING  ${v.name} ${label}`);
    console.error(`             ${v.description}`);
    hasErrors = true;
    continue;
  }

  if (v.validate && !v.validate(value)) {
    console.warn(`  ⚠ INVALID  ${v.name} ${label}`);
    console.warn(`             Value does not look correct — check ${v.description}`);
    hasWarnings = true;
    continue;
  }

  console.log(`  ✓ OK       ${v.name} ${label}`);
}

// Warn about secrets that look like they might be swapped
if (
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL === process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error('\n  ✗ SECURITY: NEXT_PUBLIC_SUPABASE_URL equals SUPABASE_SERVICE_ROLE_KEY — keys are swapped');
  hasErrors = true;
}

// Warn if running with production URL but no service role
if (
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') &&
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.warn('\n  ⚠ WARNING: Remote Supabase URL detected but SUPABASE_SERVICE_ROLE_KEY is not set');
  hasWarnings = true;
}

console.log('─'.repeat(50));

if (hasErrors) {
  console.error('\n  FAIL — missing or invalid required environment variables.\n');
  process.exit(1);
}

if (hasWarnings) {
  console.warn('\n  WARN — some variables may be misconfigured. Review warnings above.\n');
  process.exit(0);
}

console.log('\n  All environment variables are set correctly.\n');
