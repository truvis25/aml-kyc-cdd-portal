#!/usr/bin/env tsx
/**
 * Docs-Sync utility: update the TruVis AML/KYC/CDD Full SaaS Command Center
 * spreadsheet after a module ships.
 *
 * Works directly with the xlsx file in Google Drive — no file conversion or
 * extra storage used. Flow: download xlsx → parse with SheetJS → update cells
 * → re-upload in place via Drive API media update.
 *
 * Usage:
 *   npx tsx scripts/sync-feature-sheet.ts \
 *     --module "Risk / CDD / EDD" \
 *     --features "Minimum EDD form,Source of funds field" \
 *     --status "✅ Completed" \
 *     --pr 63
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  — full JSON key (single-line or pretty-printed)
 *   GOOGLE_SHEETS_SPREADSHEET_ID — Drive file ID (default: TruVis Command Center)
 *
 * Column layout (Feature Registry sheet):
 *   A = Module   B = Feature   C = Status   J = Next Sprint
 *
 * Exit 0 always — never blocks CI. Falls back to a no-op log when env is unset.
 */

import * as path from 'node:path'
import * as dotenv from 'dotenv'
import { google } from 'googleapis'
import * as XLSX from 'xlsx'

// Load .env.local for local dev; CI/CD sets env vars directly.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const FILE_ID =
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? '1Xbi2tkMjwa6qrbxXRQTvvuOIegje0j1M'
const SHEET_NAME = 'Feature Registry'

// Column indices (0-based)
const COL_MODULE = 0       // A
const COL_FEATURE = 1      // B
const COL_STATUS = 2       // C
const COL_NEXT_SPRINT = 9  // J

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
    console.error(
      'Usage: sync-feature-sheet.ts --module "<name>" --features "<f1,f2>" [--status "✅ Completed"] [--pr <N>]',
    )
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
      scopes: ['https://www.googleapis.com/auth/drive'],
    })
  } catch {
    console.warn('WARN: GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON — Sheets sync skipped.')
    return null
  }
}

async function downloadXlsx(auth: ReturnType<typeof buildAuth>, fileId: string): Promise<Buffer> {
  const drive = google.drive({ version: 'v3', auth: auth! })
  const res = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' },
  )
  return Buffer.from(res.data as ArrayBuffer)
}

async function uploadXlsx(
  auth: ReturnType<typeof buildAuth>,
  fileId: string,
  buffer: Buffer,
): Promise<void> {
  const drive = google.drive({ version: 'v3', auth: auth! })
  const { Readable } = await import('node:stream')
  await drive.files.update({
    fileId,
    supportsAllDrives: true,
    media: {
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      body: Readable.from(buffer),
    },
  })
}

async function main() {
  const args = parseArgs()
  if (!args) process.exit(1)

  const auth = buildAuth()
  if (!auth) {
    console.log('GOOGLE_SERVICE_ACCOUNT_JSON not set — Sheets sync is a no-op.')
    console.log('Set this env var to enable live Google Sheets updates.')
    process.exit(0)
  }

  // Download xlsx
  let xlsxBuffer: Buffer
  try {
    console.log(`Downloading spreadsheet ${FILE_ID}…`)
    xlsxBuffer = await downloadXlsx(auth, FILE_ID)
    console.log(`Downloaded ${Math.round(xlsxBuffer.length / 1024)} KB`)
  } catch (err) {
    const msg = (err as Error).message ?? ''
    if (msg.includes('not have permission') || msg.includes('403') || msg.includes('not found')) {
      console.error(`ERROR: Cannot access file ${FILE_ID}.`)
      console.error(
        `Share the spreadsheet with: amna-930@truvis-n8n-automation.iam.gserviceaccount.com (Editor role)`,
      )
    } else {
      console.error('ERROR downloading spreadsheet:', msg)
    }
    process.exit(0) // non-blocking
  }

  // Parse xlsx
  const workbook = XLSX.read(xlsxBuffer, { type: 'buffer' })
  const sheet = workbook.Sheets[SHEET_NAME]
  if (!sheet) {
    const available = workbook.SheetNames.join(', ')
    console.error(`ERROR: Sheet "${SHEET_NAME}" not found. Available sheets: ${available}`)
    process.exit(0)
  }

  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  // Find matching rows
  const normalise = (s: string) =>
    String(s).toLowerCase().replace(/\s+/g, ' ').trim()
  const targetModule = normalise(args.moduleName)
  const targetFeatures = new Set(args.features.map(normalise))
  const nextSprintNote = args.pr ? `Shipped PR #${args.pr}` : 'Shipped'

  const updated: string[] = []

  rows.forEach((row, i) => {
    if (i === 0) return // header
    const rowModule = normalise(row[COL_MODULE] ?? '')
    const rowFeature = normalise(row[COL_FEATURE] ?? '')
    if (rowModule === targetModule && targetFeatures.has(rowFeature)) {
      row[COL_STATUS] = args.status
      row[COL_NEXT_SPRINT] = nextSprintNote
      updated.push(row[COL_FEATURE] ?? `row ${i + 1}`)
    }
  })

  if (updated.length === 0) {
    console.log(`No matching rows for module "${args.moduleName}".`)
    console.log('Features searched:', args.features.join(', '))
    process.exit(0)
  }

  // Write rows back into the sheet
  XLSX.utils.sheet_add_aoa(sheet, rows, { origin: 'A1' })

  // Re-upload
  const updatedBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  try {
    console.log('Uploading updated spreadsheet…')
    await uploadXlsx(auth, FILE_ID, updatedBuffer)
    console.log(`\n✅ Sheets sync complete — ${updated.length} row(s) updated:`)
    for (const f of updated) {
      console.log(`   • "${f}" → ${args.status} | ${nextSprintNote}`)
    }
  } catch (err) {
    console.error('ERROR uploading updated spreadsheet:', (err as Error).message)
    process.exit(0) // non-blocking
  }
}

main().catch((err) => {
  console.error('Unexpected error in sync-feature-sheet:', err)
  process.exit(0) // non-blocking — never break CI
})
