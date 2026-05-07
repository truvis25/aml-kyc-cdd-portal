#!/usr/bin/env tsx
/**
 * Phase-0 gate — verifies that the project's foundation artefacts exist.
 *
 * Tech Lead runs this at the start of every session. If it fails, the session
 * stops until the missing files are created.
 *
 * Foundation list sources (checked in order):
 * 1. Hard-coded baseline below (artefacts every project must have).
 * 2. PROJECT.md → `additionalFoundations` array (project-specific extensions).
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const ROOT = process.cwd()

const BASELINE_FOUNDATIONS: string[] = [
  'PROJECT.md',
  'CLAUDE.md',
  'package.json',
  'tsconfig.json',
  // Supabase stack (no Prisma)
  'lib/supabase/server.ts',
  'lib/supabase/client.ts',
  'lib/supabase/admin.ts',
  // Audit (portal uses modules/audit)
  'modules/audit/audit.service.ts',
  'modules/audit/audit.types.ts',
  // Team agent lib bridges
  'lib/audit/log.ts',
  'lib/notifications/idempotency.ts',
  'lib/validate/params.ts',
  'lib/public/constants.ts',
  'lib/public/example.ts',
  // Team agent scripts
  'scripts/check-foundations.ts',
  'scripts/check-architect-triggers.ts',
  'scripts/check-migration-safety.ts',
  'scripts/check-env-readiness.ts',
  'scripts/_qa/assert.ts',
  // Docs
  'docs/development-workflow.md',
  'docs/adr/INDEX.md',
]

function readProjectExtensions(): string[] {
  const projectPath = path.join(ROOT, 'PROJECT.md')
  if (!fs.existsSync(projectPath)) return []
  const content = fs.readFileSync(projectPath, 'utf8')
  const match = content.match(/additionalFoundations:\s*\n((?:\s*-\s*.+\n?)+)/)
  if (!match) return []
  return match[1]
    .split('\n')
    .map((l) => l.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean)
}

function main(): void {
  const foundations = [...BASELINE_FOUNDATIONS, ...readProjectExtensions()]
  const missing = foundations.filter((f) => !fs.existsSync(path.join(ROOT, f)))

  if (missing.length === 0) {
    console.log(`OK — ${foundations.length} foundations present.`)
    process.exit(0)
  } else {
    console.error(`FOUNDATIONS_INCOMPLETE — ${missing.length} missing:`)
    for (const f of missing) {
      console.error(`  ✗ ${f}`)
    }
    process.exit(1)
  }
}

main()
