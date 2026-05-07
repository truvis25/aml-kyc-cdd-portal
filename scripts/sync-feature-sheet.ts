#!/usr/bin/env tsx
/**
 * Docs-Sync utility: update the TruVis AML/KYC/CDD Full SaaS Command Center
 * Google Sheet after a module ships.
 *
 * Usage:
 *   npx tsx scripts/sync-feature-sheet.ts \
 *     --module "Risk / CDD / EDD" \
 *     --features "Minimum EDD form,Source of funds field" \
 *     --status "✅ Completed" \
 *     --pr 63
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  — full JSON key of the service account
 *                                   (single-line or pretty-printed)
 *   GOOGLE_SHEETS_SPREADSHEET_ID — spreadsheet ID
 *                                   (default: 1Xbi2tkMjwa6qrbxXRQTvvuOIegje0j1M)
 *
 * Column layout (Feature Registry sheet):
 *   A = Module   B = Feature   C = Status   J = Next Sprint
 *
 * Exit 0 on success or when env is not configured (no-op, non-blocking).
 * Exit 1 only on unexpected errors so CI never breaks due to Sheets issues.
 */

import { google } from 'googleapis'

const SPREADSHEET_ID =
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? '1Xbi2tkMjwa6qrbxXRQTvvuOIegje0j1M'
const SHEET_NAME = 'Feature Registry'

// Column indices (0-based) — used to compute A1 notation ranges
const COL_MODULE = 0        // A
const COL_FEATURE = 1       // B
const COL_STATUS = 2        // C
const COL_NEXT_SPRINT = 9   // J

function colLetter(idx: number): string {
  return String.fromCharCode(65 + idx)
}

interface Args {
  moduleName: string
  features: string[]
  status: string
  pr?: number
}

function parseArgs(): Args | null {
  const argv = process.argv.slice(2)
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag)
    return i !== -1 ? argv[i + 1] : undefined
  }

  const moduleName = get('--module')
  const featuresRaw = get('--features')
  const status = get('--status') ?? '✅ Completed'
  const prRaw = get('--pr')

  if (!moduleName || !featuresRaw) {
    console.error('Usage: sync-feature-sheet.ts --module "<name>" --features "<f1,f2>" [--status "✅ Completed"] [--pr <N>]')
    return null
  }

  return {
    moduleName,
    features: featuresRaw.split(',').map((f) => f.trim()).filter(Boolean),
    status,
    pr: prRaw ? parseInt(prRaw, 10) : undefined,
  }
}

function buildAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) return null
  try {
    const key = JSON.parse(raw)
    return new google.auth.GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
  } catch {
    console.warn('WARN: GOOGLE_SERVICE_ACCOUNT_JSON is set but not valid JSON — Sheets sync skipped.')
    return null
  }
}

async function getSheetData(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:K`,
  })
  return res.data.values ?? []
}

async function main() {
  const args = parseArgs()
  if (!args) {
    process.exit(1)
  }

  const auth = buildAuth()
  if (!auth) {
    console.log('GOOGLE_SERVICE_ACCOUNT_JSON not set — Sheets sync is a no-op.')
    console.log('Set this env var to enable live Google Sheets updates.')
    process.exit(0)
  }

  const sheets = google.sheets({ version: 'v4', auth })

  let rows: string[][]
  try {
    rows = (await getSheetData(sheets, SPREADSHEET_ID)) as string[][]
  } catch (err) {
    console.error('ERROR: Could not read Feature Registry sheet:', (err as Error).message)
    process.exit(0) // non-blocking
  }

  const normalise = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  const targetModule = normalise(args.moduleName)
  const targetFeatures = new Set(args.features.map(normalise))

  const updates: Array<{ row: number; feature: string }> = []

  rows.forEach((row, i) => {
    if (i === 0) return // header
    const rowModule = normalise(row[COL_MODULE] ?? '')
    const rowFeature = normalise(row[COL_FEATURE] ?? '')
    if (rowModule === targetModule && targetFeatures.has(rowFeature)) {
      updates.push({ row: i + 1, feature: row[COL_FEATURE] ?? '' }) // 1-based
    }
  })

  if (updates.length === 0) {
    console.log(`No matching rows found for module "${args.moduleName}" with the given features.`)
    console.log('Features searched:', args.features.join(', '))
    process.exit(0)
  }

  const nextSprintNote = args.pr ? `Shipped PR #${args.pr}` : 'Shipped'

  for (const { row, feature } of updates) {
    const statusRange = `${SHEET_NAME}!${colLetter(COL_STATUS)}${row}`
    const nextSprintRange = `${SHEET_NAME}!${colLetter(COL_NEXT_SPRINT)}${row}`

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: statusRange,
      valueInputOption: 'RAW',
      requestBody: { values: [[args.status]] },
    })

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: nextSprintRange,
      valueInputOption: 'RAW',
      requestBody: { values: [[nextSprintNote]] },
    })

    console.log(`✅ Updated row ${row}: "${feature}" → ${args.status} | ${nextSprintNote}`)
  }

  console.log(`\nSheets sync complete — ${updates.length} row(s) updated in "${SHEET_NAME}".`)
}

main().catch((err) => {
  console.error('Unexpected error in sync-feature-sheet:', err)
  process.exit(0) // non-blocking — never break CI
})
