#!/usr/bin/env tsx
/**
 * Postgres migration safety linter.
 *
 * Scans all files in supabase/migrations/ for patterns that are dangerous
 * on a live Postgres database (long-running locks, data loss, missing
 * backfill guards, etc.).
 *
 * Exit 0 = clean. Exit 1 = one or more issues found.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

interface LintRule {
  id: string
  severity: 'error' | 'warning'
  description: string
  test: (sql: string) => boolean
}

const RULES: LintRule[] = [
  {
    id: 'no-drop-table',
    severity: 'error',
    description: 'DROP TABLE without a data migration or archive step',
    test: (sql) => /DROP\s+TABLE/i.test(sql),
  },
  {
    id: 'no-drop-column',
    severity: 'error',
    description: 'DROP COLUMN is destructive — ensure a backfill window has passed',
    test: (sql) => /DROP\s+COLUMN/i.test(sql),
  },
  {
    id: 'not-null-without-default',
    severity: 'error',
    description: 'NOT NULL column added without a DEFAULT — will fail on non-empty tables',
    test: (sql) => {
      const addColRe = /ADD\s+COLUMN\s+\w+\s+\w+(?:\([^)]*\))?\s+NOT\s+NULL(?!\s+DEFAULT)/i
      return addColRe.test(sql)
    },
  },
  {
    id: 'no-full-table-rewrite',
    severity: 'warning',
    description: 'ALTER TABLE … ALTER COLUMN TYPE can lock large tables',
    test: (sql) => /ALTER\s+COLUMN\s+\w+\s+TYPE/i.test(sql),
  },
  {
    id: 'no-unindexed-fk',
    severity: 'warning',
    description: 'Foreign key added without a corresponding index — may cause lock escalation',
    test: (sql) => {
      const hasFk = /REFERENCES\s+\w+\s*\(/i.test(sql)
      const hasIndex = /CREATE\s+INDEX/i.test(sql)
      return hasFk && !hasIndex
    },
  },
  {
    id: 'no-truncate',
    severity: 'error',
    description: 'TRUNCATE on a live table is dangerous',
    test: (sql) => /TRUNCATE\s+/i.test(sql),
  },
  {
    id: 'no-lock-table',
    severity: 'error',
    description: 'LOCK TABLE can cause application-wide deadlock',
    test: (sql) => /LOCK\s+TABLE/i.test(sql),
  },
  {
    id: 'prefer-concurrent-index',
    severity: 'warning',
    description: 'CREATE INDEX without CONCURRENTLY blocks writes on large tables',
    test: (sql) => /CREATE\s+(?:UNIQUE\s+)?INDEX(?!\s+CONCURRENTLY)/i.test(sql),
  },
]

function lintFile(filePath: string): { errors: string[]; warnings: string[] } {
  const sql = fs.readFileSync(filePath, 'utf8')
  const errors: string[] = []
  const warnings: string[] = []

  for (const rule of RULES) {
    if (rule.test(sql)) {
      const msg = `[${rule.id}] ${rule.description}`
      if (rule.severity === 'error') errors.push(msg)
      else warnings.push(msg)
    }
  }
  return { errors, warnings }
}

function main(): void {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')

  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations found.')
    process.exit(0)
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('No migrations found.')
    process.exit(0)
  }

  let totalErrors = 0
  let totalWarnings = 0

  for (const file of files) {
    let result: { errors: string[]; warnings: string[] }
    try {
      result = lintFile(path.join(migrationsDir, file))
    } catch (err) {
      console.error(`  ERROR   [unreadable] ${file}: ${(err as Error).message}`)
      totalErrors++
      continue
    }
    const { errors, warnings } = result
    if (errors.length + warnings.length > 0) {
      console.log(`\n${file}:`)
      for (const e of errors) console.error(`  ERROR   ${e}`)
      for (const w of warnings) console.warn(`  WARNING ${w}`)
    }
    totalErrors += errors.length
    totalWarnings += warnings.length
  }

  console.log(`\nLinted ${files.length} migration(s): ${totalErrors} error(s), ${totalWarnings} warning(s).`)

  if (totalErrors > 0) {
    process.exit(1)
  }
}

main()
