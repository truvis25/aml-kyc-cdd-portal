#!/usr/bin/env tsx
/**
 * Env-var readiness gate.
 *
 * Reads .env.example to discover required variables, then checks:
 * 1. Each variable is present in the environment (or .env file).
 * 2. No variable still contains a placeholder value (your-*, sk_test_, etc.).
 *
 * This script is INFORMATIONAL — it exits 0 even when placeholders are found,
 * so CI isn't blocked. It only exits 1 on a hard error (e.g. missing .env.example).
 *
 * The QA Engineer includes the output in its report.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const PLACEHOLDER_PATTERNS = [
  /^https?:\/\/your-/i,
  /^your-/i,
  /^<.*>$/,
  /\[password\]/i,
  /\[ref\]/i,
  /^sk_test_\.\.\./i,
  /^pk_test_\.\.\./i,
  /^whsec_\.\.\./i,
  /^re_\.\.\./i,
  /^signkey-\.\.\./i,
]

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((re) => re.test(value.trim()))
}

function loadEnvFile(envPath: string): void {
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx)
    const val = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, '')
    if (!(key in process.env)) process.env[key] = val
  }
}

function main(): void {
  const examplePath = path.join(process.cwd(), '.env.example')
  if (!fs.existsSync(examplePath)) {
    console.error('ERROR: .env.example not found. Cannot check env readiness.')
    process.exit(1)
  }

  loadEnvFile(path.join(process.cwd(), '.env'))

  const exampleContent = fs.readFileSync(examplePath, 'utf8')
  const required = exampleContent
    .split(/\r?\n/)
    .filter((l) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(l.trim()))
    .map((l) => l.split('=')[0].trim())

  const missing: string[] = []
  const placeholders: string[] = []

  for (const key of required) {
    const val = process.env[key]
    if (!val) {
      missing.push(key)
    } else if (isPlaceholder(val)) {
      placeholders.push(key)
    }
  }

  if (missing.length > 0) {
    console.warn(`MISSING (${missing.length}):`)
    for (const k of missing) console.warn(`  ✗ ${k}`)
  }

  if (placeholders.length > 0) {
    console.warn(`PLACEHOLDER (${placeholders.length}) — still contains a placeholder value:`)
    for (const k of placeholders) console.warn(`  ~ ${k}`)
  }

  if (missing.length === 0 && placeholders.length === 0) {
    console.log(`OK — all ${required.length} env vars present and non-placeholder.`)
  } else {
    console.log(
      `\nEnv check: ${required.length - missing.length - placeholders.length}/${required.length} ready. ` +
        'Fill in missing / placeholder values before running browser tests.',
    )
  }

  process.exit(0)
}

main()
