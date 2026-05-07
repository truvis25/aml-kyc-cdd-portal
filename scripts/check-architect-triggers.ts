#!/usr/bin/env tsx
/**
 * Architect-escalation trigger detector.
 *
 * Scans the current git diff (staged + unstaged, relative to main) for the
 * 11 patterns that require Architect review. Prints fired triggers so Tech
 * Lead can decide whether to dispatch the Architect agent.
 *
 * Exit code 0 = no triggers. Exit code 1 = one or more triggers fired.
 */

import { execSync } from 'node:child_process'

interface Trigger {
  id: number
  name: string
  description: string
  test: (diff: string, files: string[]) => boolean
}

const TRIGGERS: Trigger[] = [
  {
    id: 1,
    name: 'new-prisma-model',
    description: 'New Prisma model or @@map table rename',
    test: (diff) => /^\+\s*model\s+\w+\s*\{/m.test(diff) || /^\+.*@@map\(/m.test(diff),
  },
  {
    id: 2,
    name: 'new-migration',
    description: 'New Supabase migration file',
    test: (_diff, files) => files.some((f) => f.startsWith('supabase/migrations/') && !f.endsWith('/')),
  },
  {
    id: 3,
    name: 'auth-middleware-change',
    description: 'Auth middleware or Supabase lib change',
    test: (_diff, files) =>
      files.some((f) => f === 'middleware.ts' || f.startsWith('lib/supabase/')),
  },
  {
    id: 4,
    name: 'rls-policy',
    description: 'New or changed Row-Level Security policy',
    test: (diff) =>
      /CREATE\s+POLICY|ALTER\s+POLICY|DROP\s+POLICY|ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(diff),
  },
  {
    id: 5,
    name: 'public-api-pii',
    description: 'Public API route exposing user PII',
    test: (_diff, files) =>
      files.some(
        (f) =>
          f.startsWith('app/api/') &&
          f.endsWith('route.ts') &&
          !f.includes('/admin/'),
      ),
  },
  {
    id: 6,
    name: 'stripe-payment',
    description: 'Stripe webhook or payment-intent handler',
    test: (diff, files) =>
      /stripe|payment.intent|webhook.*stripe/i.test(diff) ||
      files.some((f) => /stripe|payment/i.test(f)),
  },
  {
    id: 7,
    name: 'background-job',
    description: 'New background job or queue consumer',
    test: (diff, files) =>
      /inngest|bullmq|pg.boss|createFunction|defineJob/i.test(diff) ||
      files.some((f) => f.includes('/jobs/') || f.includes('/workers/')),
  },
  {
    id: 8,
    name: 'cross-tenant-access',
    description: 'Cross-tenant data access pattern',
    test: (diff) =>
      /SELECT\s+\*\s+FROM\s+\w+\s+WHERE(?!.*auth\.uid)/i.test(diff) ||
      /supabase\.from\([^)]+\)\.select\(/.test(diff) && !/tenant_id/.test(diff),
  },
  {
    id: 9,
    name: 'file-storage',
    description: 'File upload or storage policy change',
    test: (diff, files) =>
      /supabase\.storage|createSignedUrl|upload\(/i.test(diff) ||
      files.some((f) => f.includes('storage')),
  },
  {
    id: 10,
    name: 'external-api-integration',
    description: 'New external API integration (OAuth, webhooks, third-party SDKs)',
    test: (diff, files) =>
      /new\s+OAuth|passport\.|createOAuthClient|registerWebhook/i.test(diff) ||
      files.some((f) => f.includes('/integrations/') || f.includes('/oauth/')),
  },
  {
    id: 11,
    name: 'privacy-gate-change',
    description: 'FORBIDDEN_FIELD_SET or toPublic<Model> change',
    test: (_diff, files) =>
      files.some(
        (f) => f === 'lib/public/constants.ts' || f.startsWith('lib/public/'),
      ),
  },
]

function getDiff(): { diff: string; files: string[] } {
  try {
    const base = execSync('git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main 2>/dev/null', {
      encoding: 'utf8',
    }).trim()
    const diff = execSync(`git diff ${base} HEAD`, { encoding: 'utf8' })
    const files = execSync(`git diff --name-only ${base} HEAD`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
    return { diff, files }
  } catch {
    try {
      const diff = execSync('git diff HEAD', { encoding: 'utf8' })
      const files = execSync('git diff --name-only HEAD', { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(Boolean)
      return { diff, files }
    } catch {
      console.error('ERROR: Cannot determine git diff. Ensure this is a git repo with at least one commit.')
      process.exit(1)
    }
  }
}

function main(): void {
  const { diff, files } = getDiff()
  const fired = TRIGGERS.filter((t) => t.test(diff, files))

  if (fired.length === 0) {
    console.log('No architect triggers fired.')
    process.exit(0)
  }

  console.log(`${fired.length} architect trigger(s) fired:\n`)
  for (const t of fired) {
    console.log(`  [${t.id}] ${t.name} — ${t.description}`)
  }
  console.log('\nDispatch Architect before continuing.')
  process.exit(1)
}

main()
