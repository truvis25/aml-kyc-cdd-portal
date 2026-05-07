#!/usr/bin/env tsx
/**
 * Rebuilds the TruVis Command Center spreadsheet as a comprehensive 8-tab BRD.
 *
 * Usage: npx tsx scripts/rebuild-command-center.ts
 *
 * Required env: GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_SHEETS_SPREADSHEET_ID
 */

import * as path from 'node:path'
import * as dotenv from 'dotenv'
import { google } from 'googleapis'
import * as XLSX from 'xlsx'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const FILE_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? '1Xbi2tkMjwa6qrbxXRQTvvuOIegje0j1M'

function buildAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set')
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
}

async function downloadXlsx(auth: ReturnType<typeof buildAuth>): Promise<Buffer> {
  const drive = google.drive({ version: 'v3', auth })
  const res = await drive.files.get(
    { fileId: FILE_ID, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' },
  )
  return Buffer.from(res.data as ArrayBuffer)
}

async function uploadXlsx(auth: ReturnType<typeof buildAuth>, buf: Buffer): Promise<void> {
  const drive = google.drive({ version: 'v3', auth })
  const { Readable } = await import('node:stream')
  await drive.files.update({
    fileId: FILE_ID,
    supportsAllDrives: true,
    media: {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      body: Readable.from(buf),
    },
  })
}

// ─── Sheet helpers ────────────────────────────────────────────────────────────

function hdr(ws: XLSX.WorkSheet, row: (string | number)[], rowIdx: number) {
  XLSX.utils.sheet_add_aoa(ws, [row], { origin: { r: rowIdx, c: 0 } })
}

function addSheet(wb: XLSX.WorkBook, name: string, rows: (string | number | null)[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, name)
  return ws
}

// ─── Sheet 1: Command Center ──────────────────────────────────────────────────

function buildCommandCenter(): (string | number | null)[][] {
  const today = new Date().toISOString().slice(0, 10)
  return [
    ['🚀 TruVis AML/KYC/CDD Portal — Product Command Center', null, null, null, null, null, null],
    [`Last updated: ${today}`, null, null, null, null, null, null],
    [],
    ['📊 PRODUCT READINESS', null, null, '🎯 LAUNCH TARGETS', null, null, null],
    ['Metric', 'Count', '% of Total', 'Milestone', 'Target Date', 'Status', null],
    ['✅ Built', 90, '54%', 'Tenant Zero (internal)', '09 May 2026', '🟡 In Progress', null],
    ['🟡 In Progress', 33, '20%', 'MVP Controlled Pilot', '30 May 2026', '🔴 Not Started', null],
    ['❌ Missing', 44, '26%', 'UAE Market Pilot', '30 Jun 2026', '🔴 Not Started', null],
    ['Total Tracked', 167, '100%', 'Public SaaS Launch', '11 Jul 2026', '🔴 Not Started', null],
    ['MVP Readiness', null, '84%', null, null, null, null],
    ['Overall Progress', null, '65%', null, null, null, null],
    [],
    ['🚦 LAUNCH GATES — CEO DECISION BOARD', null, null, null, null, null, null],
    ['Gate', 'Status', 'Required Actions', 'Owner', 'Target', 'Blocker', null],
    ['Commercial Automation', '🔴 BLOCKED', 'Billing, usage metering, invoices, plan limits, self-serve signup', 'Product + BE', 'Jun 2026', 'No billing integration', null],
    ['API / SDK Platform', '🔴 BLOCKED', 'Developer portal, sandbox env, REST API docs, Web SDK/iframe', 'BE + DevRel', 'Jun 2026', 'API not public', null],
    ['Continuous Monitoring / KYT', '🔴 BLOCKED', 'Periodic re-screening, transaction API, auto-case creation on risk change', 'BE', 'Jun 2026', 'No cron re-screen', null],
    ['Security & Tenant Isolation', '🟡 PARTIAL', 'RLS regression suite, MFA enforcement tests, service-role boundary audit', 'BE + QA', 'May 2026', 'Tests not written', null],
    ['Enterprise Trust / Ops', '🔴 BLOCKED', 'DR drill, privacy centre, incident runbook, SLA definitions, Sentry', 'Ops + BE', 'Jun 2026', 'No monitoring', null],
    ['UAE Localization', '🟡 PARTIAL', 'Arabic UI/RTL, local sanctions lists, data residency evidence, Fintech template', 'FE + Legal', 'Jun 2026', 'Arabic UI 0%', null],
    [],
    ['📋 MODULE HEALTH SUMMARY', null, null, null, null, null, null],
    ['Module', 'Built', 'Partial', 'Missing', '% Complete', 'MVP %', 'Sprint 2 Focus'],
    ['Platform Core', 3, 3, 2, '56%', '60%', 'MFA + RLS tests'],
    ['Roles & Permissions', 7, 3, 0, '85%', '90%', 'SAR visibility + read-only PII'],
    ['Customer Onboarding', 5, 3, 2, '65%', '80%', 'Session resume + abandoned tracking'],
    ['Identity Verification', 6, 1, 2, '81%', '90%', 'Manual fallback'],
    ['Document Management', 4, 3, 2, '61%', '75%', 'Rejection reason + expiry + checklist'],
    ['Screening & Monitoring', 6, 0, 4, '60%', '72%', 'Monthly re-screening workflow'],
    ['Risk / CDD / EDD', 8, 2, 2, '75%', '85%', 'CDD/EDD routing'],
    ['Case Management', 9, 0, 2, '82%', '90%', 'Bulk actions + SLA alerts'],
    ['SAR / MLRO Workbench', 6, 2, 1, '78%', '88%', 'SAR visibility + resolution + audit event'],
    ['Reporting & Audit', 7, 1, 2, '75%', '82%', 'Audit export + monthly report'],
    ['Notifications', 3, 2, 3, '50%', '60%', 'Approval email + fallback templates'],
    ['Tenant Admin / Workflow Config', 6, 2, 3, '64%', '72%', 'Document config + risk thresholds + Real Estate/CSP templates'],
    ['API / SDK / Integrations', 3, 1, 4, '44%', '30%', '— (Sprint 3)'],
    ['Billing / Commercial', 0, 4, 4, '25%', '20%', 'Pilot invoice + agreement'],
    ['Continuous Monitoring / KYT', 0, 0, 7, '0%', '0%', '— (Sprint 3)'],
    ['UAE Market Features', 10, 0, 6, '63%', '78%', 'Real Estate + CSP templates'],
    ['Enterprise Trust / Ops', 0, 1, 7, '3%', '5%', 'Sentry + runbook'],
    ['SaaS Platformization', 0, 0, 8, '0%', '0%', '— (Backlog)'],
  ]
}

// ─── Sheet 2: BRD Feature Registry ───────────────────────────────────────────

function buildBRD(): (string | number | null)[][] {
  const HDR = [
    'Module', 'Epic', 'User Story', 'Acceptance Criteria',
    'Priority', 'Status', 'MVP Gate', 'SaaS Gate', 'Sprint',
    'Owner', 'Story Points', 'Dependencies', 'Risk', 'QA Status',
    'PR Ref', 'Notion URL', 'Notes',
  ]

  // [module, epic, story, ac, priority, status, mvp, saas, sprint, owner, pts, deps, risk, qa, pr, notion, notes]
  const rows: (string | number | null)[][] = [
    HDR,
    // ── Platform Core ──
    ['Platform Core', 'Multi-tenancy', 'As a tenant admin, I need isolated data so my data is never visible to other tenants', 'All queries filtered by tenant_id; RLS enforced on every table; E2E isolation test passes', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'BE', 8, 'None', '🔴 High', '❌ Not tested', null, 'https://www.notion.so/354bc9974963817eabe3fd391842d7a7', 'RLS regression suite needed'],
    ['Platform Core', 'Auth', 'As any user, I need to log in securely so my session is authenticated', 'Supabase Auth email+password works; JWT enriched with tenant_id and user_role; redirect on expired session', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'BE', 3, 'None', '🟡 Medium', '🟡 Partial', '#62', 'https://www.notion.so/354bc9974963817eabe3fd391842d7a7', null],
    ['Platform Core', 'JWT', 'As the system, I need enriched JWT claims so RBAC works at the edge', 'custom_access_token_hook injects tenant_id, user_role, aal; proxy.ts reads claims correctly', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'BE', 5, 'Auth', '🟡 Medium', '✅ Tested', '#migration-0005', 'https://www.notion.so/354bc9974963817eabe3fd391842d7a7', 'C-02 decision'],
    ['Platform Core', 'MFA', 'As an MLRO/Admin, I must complete MFA so privileged access is protected', 'TOTP setup flow works; aal=aal2 enforced for MFA_REQUIRED_ROLES; redirect to /mfa-setup if not verified', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'BE+FE', 5, 'Auth', '🔴 High', '❌ Not tested', null, 'https://www.notion.so/354bc9974963817eabe3fd391842d7a7', 'MLRO accounts must enforce'],
    ['Platform Core', 'Monitoring', 'As ops, I need error monitoring so production incidents are detected immediately', 'Sentry DSN configured; error rates alerted; source maps uploaded on deploy', 'P1-High', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'Ops', 3, 'None', '🔴 High', '— N/A', null, 'https://www.notion.so/354bc9974963817eabe3fd391842d7a7', 'Pre-SaaS launch gate'],
    ['Platform Core', 'DR', 'As ops, I need backup and DR so data is recoverable within 4 hours', 'Daily Supabase backup verified; restore drill completed; RTO < 4h documented', 'P1-High', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'Ops', 5, 'None', '🔴 High', '— N/A', null, 'https://www.notion.so/354bc9974963817eabe3fd391842d7a7', 'Enterprise trust gate'],
    // ── Roles & Permissions ──
    ['Roles & Permissions', 'RBAC', 'As the system, I need role-based access so each user sees only what their role allows', '6 roles defined; JWT claims enforced in proxy.ts and API routes; assertPermission called in all sensitive routes', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'BE', 5, 'JWT', '🟡 Medium', '🟡 Partial', '#PRD', 'https://www.notion.so/354bc9974963815d8cb7f10079dac7cf', null],
    ['Roles & Permissions', 'SAR Visibility', 'As the system, I need SAR data masked from non-MLRO roles to prevent tipping-off', 'Analyst and Onboarding Agent cannot see SAR flag/register; SAR routes return 403 for non-MLRO/Admin', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'BE+QA', 3, 'RBAC', '🔴 High', '❌ Not tested', null, 'https://www.notion.so/354bc9974963815d8cb7f10079dac7cf', 'Tipping-off compliance'],
    ['Roles & Permissions', 'PII Restriction', 'As the system, I need read-only users blocked from PII so data privacy is maintained', 'Read-only role cannot access name/DOB/ID fields in API responses; FORBIDDEN_FIELD_SET enforced', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'BE+QA', 3, 'RBAC', '🔴 High', '❌ Not tested', null, 'https://www.notion.so/354bc9974963815d8cb7f10079dac7cf', null],
    // ── Customer Onboarding ──
    ['Customer Onboarding', 'Individual KYC', 'As a customer, I need to complete KYC onboarding so my account can be approved', 'Multi-step form collects personal data; consent captured; session persists on refresh; case created on submit', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'FE+BE', 8, 'None', '🟢 Low', '🟡 Partial', '#PRD', 'https://www.notion.so/354bc997496381fa86e4d030bf4d94c4', null],
    ['Customer Onboarding', 'Corporate KYB', 'As a business customer, I need to complete KYB so my company is onboarded', 'Corporate profile + trade licence + UBO form submitted; documents uploaded; case created', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'FE+BE', 8, 'Individual KYC', '🟢 Low', '🟡 Partial', '#PRD', 'https://www.notion.so/354bc997496381fa86e4d030bf4d94c4', null],
    ['Customer Onboarding', 'Session Resume', 'As a customer, I can resume an interrupted onboarding so I do not lose my progress', 'Partially completed session persists in DB; customer can return via unique link and continue from last step', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'FE+BE', 5, 'Individual KYC', '🟡 Medium', '❌ Not tested', null, 'https://www.notion.so/354bc997496381fa86e4d030bf4d94c4', null],
    ['Customer Onboarding', 'UAE Pass', 'As a UAE resident, I can sign in with UAE Pass so my identity is pre-verified', 'OIDC bridge works; PKCE flow; JWKS verification; claims pre-fill national_id and name; audit trail', 'P1-High', '✅ Built', '— Not needed', '✅ Required', 'Sprint 1 Done', 'BE', 8, 'Auth', '🟡 Medium', '🟡 Partial', '#73', 'https://www.notion.so/354bc997496381fa86e4d030bf4d94c4', 'PR #73'],
    ['Customer Onboarding', 'Arabic / RTL', 'As an Arabic-speaking customer, I can complete onboarding in Arabic so the product is accessible', 'All onboarding screens render RTL; Arabic translations complete; no layout breakage', 'P2-Medium', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'FE', 13, 'Individual KYC', '🟡 Medium', '— N/A', null, 'https://www.notion.so/354bc997496381fa86e4d030bf4d94c4', 'Deferred to v2'],
    // ── Identity Verification ──
    ['Identity Verification', 'IDV SDK', 'As a customer, I complete liveness + document capture so my identity is verified by a provider', 'IDV Web SDK embedded; applicant created; webhook processed; result stored; manual fallback if provider fails', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'FE+BE', 8, 'None', '🟡 Medium', '🟡 Partial', '#PRD', 'https://www.notion.so/354bc9974963816eb5b5e30bf864a855', null],
    ['Identity Verification', 'Emirates ID', 'As a customer, I enter my Emirates ID so the system can validate my UAE residency', 'Luhn-validated Emirates ID field; parsing extracts nationality/DOB; stored securely', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'FE+BE', 3, 'IDV SDK', '🟢 Low', '✅ Tested', '#65', 'https://www.notion.so/354bc9974963816eb5b5e30bf864a855', 'PR #65'],
    ['Identity Verification', 'Manual Fallback', 'As an analyst, I can manually verify identity when the IDV provider fails so no customer is stuck', 'Manual override UI in case detail; fallback status recorded; audit event emitted', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'FE+BE', 5, 'IDV SDK', '🟡 Medium', '❌ Not tested', null, 'https://www.notion.so/354bc9974963816eb5b5e30bf864a855', null],
    // ── Document Management ──
    ['Document Management', 'Upload + Hash', 'As a customer, I upload documents so they are stored securely with integrity verification', 'Documents stored in private Supabase Storage; SHA-256 hash computed and stored; signed URL max 15 min', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'FE+BE', 5, 'None', '🟢 Low', '✅ Tested', '#PRD', 'https://www.notion.so/354bc99749638151a3d7e13661cd5651', null],
    ['Document Management', 'Rejection Reason', 'As an analyst, I reject documents with a reason so the customer can resubmit correctly', 'Rejection reason field in document review UI; reason stored; customer notified by email', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'FE+BE', 3, 'Upload + Hash', '🟢 Low', '❌ Not tested', null, 'https://www.notion.so/354bc99749638151a3d7e13661cd5651', null],
    ['Document Management', 'Expiry Date', 'As an analyst, I capture document expiry dates so the system can alert before expiry', 'Expiry date field on document record; expiry alerts at 30/7/1 day before', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'FE+BE', 3, 'Upload + Hash', '🟡 Medium', '❌ Not tested', null, 'https://www.notion.so/354bc99749638151a3d7e13661cd5651', null],
    ['Document Management', 'Document Checklist', 'As a tenant admin, I configure which documents are required per client type so onboarding is consistent', 'Required document types configurable per tenant; checklist shown to customer during onboarding', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'FE+BE', 5, 'Tenant Config', '🟡 Medium', '❌ Not tested', null, 'https://www.notion.so/354bc99749638151a3d7e13661cd5651', null],
    ['Document Management', 'OCR Validation', 'As an analyst, document data is auto-extracted by OCR so manual entry errors are reduced', 'OCR provider integrated; extracted fields pre-fill form; confidence score shown', 'P2-Medium', '❌ Missing', '— Not needed', '✅ Required', 'Backlog', 'BE', 13, 'IDV SDK', '🟡 Medium', '— N/A', null, 'https://www.notion.so/354bc99749638151a3d7e13661cd5651', 'Sprint 3+'],
    // ── Screening ──
    ['Screening & Monitoring', 'Sanctions + PEP', 'As the system, I screen every customer against sanctions and PEP lists so compliance is maintained', 'ComplyAdvantage adapter integrated; sanctions + PEP + adverse media screened; hits stored; webhook processed', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'BE', 8, 'Case Management', '🔴 High', '✅ Tested', '#PRD', 'https://www.notion.so/354bc997496381d88037d1939bc39318', null],
    ['Screening & Monitoring', 'Hit Resolution', 'As an analyst, I resolve screening hits so cases can proceed after review', 'Hit detail view with match info; accept/reject decision; reason required; audit event emitted', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'FE+BE', 5, 'Sanctions + PEP', '🔴 High', '🟡 Partial', '#PRD', 'https://www.notion.so/354bc997496381d88037d1939bc39318', null],
    ['Screening & Monitoring', 'Monthly Re-screening', 'As an MLRO, I trigger monthly re-screening so existing customers are continuously monitored', 'Re-screen workflow triggered manually; all active customers re-screened; new hits create alerts', 'P0-Critical', '❌ Missing', '✅ Required', '✅ Required', 'Sprint 2', 'BE', 8, 'Sanctions + PEP', '🔴 High', '❌ Not tested', null, 'https://www.notion.so/354bc997496381d88037d1939bc39318', null],
    ['Screening & Monitoring', 'Automated Monitoring', 'As the system, I automatically re-screen customers on a schedule so monitoring is continuous', 'pg_cron or Edge Function triggers nightly re-screen; risk changes auto-create cases', 'P1-High', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'BE', 13, 'Monthly Re-screening', '🔴 High', '— N/A', null, 'https://www.notion.so/354bc997496381d88037d1939bc39318', 'SaaS launch gate'],
    ['Screening & Monitoring', 'Custom Watchlists', 'As a tenant admin, I upload custom watchlists so tenant-specific lists are screened', 'CSV upload for custom watchlist; screened alongside provider lists; hit UI shows source', 'P2-Medium', '❌ Missing', '— Not needed', '✅ Required', 'Backlog', 'BE+FE', 8, 'Sanctions + PEP', '🟡 Medium', '— N/A', null, 'https://www.notion.so/354bc997496381d88037d1939bc39318', null],
    // ── Risk / CDD / EDD ──
    ['Risk / CDD / EDD', 'Risk Scoring', 'As the system, I score customer risk so cases are routed to the right reviewer', 'Three-dimension score: geography + PEP + transaction profile; low/medium/high bands; score stored', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'BE', 8, 'None', '🟡 Medium', '✅ Tested', '#PRD', 'https://www.notion.so/354bc99749638178aa4cedf6ad42f1ec', null],
    ['Risk / CDD / EDD', 'EDD Form', 'As an analyst, I collect EDD information for high-risk customers so enhanced due diligence is documented', 'EDD form with source of wealth, source of funds, expected activity, currencies, counterparties; stored on case', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'FE+BE', 5, 'Risk Scoring', '🟡 Medium', '✅ Tested', '#63', 'https://www.notion.so/354bc99749638178aa4cedf6ad42f1ec', 'PR #63'],
    ['Risk / CDD / EDD', 'CDD / EDD Routing', 'As the system, I route medium-risk to CDD and high-risk to EDD so the right process is followed', 'CDD triggers standard review; EDD triggers senior reviewer + EDD form; routing based on score band', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'BE', 3, 'Risk Scoring', '🟡 Medium', '❌ Not tested', null, 'https://www.notion.so/354bc99749638178aa4cedf6ad42f1ec', null],
    ['Risk / CDD / EDD', 'Configurable Risk Weights', 'As a tenant admin, I configure risk weights so my firm\'s risk appetite is reflected', 'Risk weight sliders per dimension; saved per tenant; applied to all new assessments', 'P1-High', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'FE+BE', 8, 'Risk Scoring', '🟡 Medium', '— N/A', null, 'https://www.notion.so/354bc99749638178aa4cedf6ad42f1ec', null],
    ['Risk / CDD / EDD', 'Perpetual KYC', 'As the system, I trigger re-review when customer risk changes so KYC stays current', 'Risk change event triggers new case or re-review flag; MLRO notified; audit trail', 'P2-Medium', '❌ Missing', '— Not needed', '✅ Required', 'Backlog', 'BE', 8, 'Automated Monitoring', '🟡 Medium', '— N/A', null, 'https://www.notion.so/354bc99749638178aa4cedf6ad42f1ec', null],
    // ── Case Management ──
    ['Case Management', 'Case Lifecycle', 'As an analyst, I manage cases through their lifecycle so compliance reviews are tracked end-to-end', 'Case created from onboarding; status: pending→in_review→decision; all transitions logged', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'FE+BE', 8, 'None', '🟢 Low', '✅ Tested', '#PRD', 'https://www.notion.so/354bc997496381ed97a8d2296ec74f58', null],
    ['Case Management', 'RAI', 'As an analyst, I request additional information from customers so missing data can be collected', 'RAI action creates a customer-facing request; email notification sent; case paused until response', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'FE+BE', 5, 'Case Lifecycle', '🟢 Low', '✅ Tested', '#PRD', 'https://www.notion.so/354bc997496381ed97a8d2296ec74f58', null],
    ['Case Management', 'Approve / Reject', 'As a senior reviewer or MLRO, I make final decisions on cases so customers are approved or declined', 'Approve and Reject actions with mandatory reason; final decision locked after submission; email to customer', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'FE+BE', 5, 'Case Lifecycle', '🟡 Medium', '✅ Tested', '#PRD', 'https://www.notion.so/354bc997496381ed97a8d2296ec74f58', null],
    ['Case Management', 'SLA Alerts', 'As an MLRO, I receive alerts for overdue cases so SLA breaches are prevented', 'SLA timer per case type; overdue cases highlighted in dashboard; MLRO notified by email', 'P1-High', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'BE+FE', 5, 'Case Lifecycle', '🟡 Medium', '— N/A', null, 'https://www.notion.so/354bc997496381ed97a8d2296ec74f58', null],
    ['Case Management', 'Bulk Actions', 'As an analyst, I process multiple cases at once so queue management is efficient', 'Multi-select on case queue; bulk assign, bulk export, bulk status change for eligible cases', 'P2-Medium', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'FE+BE', 8, 'Case Lifecycle', '🟢 Low', '— N/A', null, 'https://www.notion.so/354bc997496381ed97a8d2296ec74f58', null],
    // ── SAR / MLRO ──
    ['SAR / MLRO Workbench', 'SAR Flag + Register', 'As an MLRO, I flag suspicious cases and maintain a SAR register so regulatory obligations are met', 'SAR flag on case; SAR register page (MLRO/Admin only); SAR notes field; tipping-off masking', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'FE+BE', 8, 'Case Management', '🔴 High', '✅ Tested', '#PRD', 'https://www.notion.so/354bc99749638114adbcc56b111c6243', null],
    ['SAR / MLRO Workbench', 'goAML Export', 'As an MLRO, I export SAR data in goAML XSD-valid XML so I can submit to the UAE FIU', 'goAML XML generated from SAR data; XSD validation passes; export audit event; submission tracking', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'BE', 8, 'SAR Flag', '🔴 High', '✅ Tested', '#74', 'https://www.notion.so/354bc99749638114adbcc56b111c6243', 'PR #74'],
    ['SAR / MLRO Workbench', 'SAR Resolution', 'As an MLRO, I record the outcome of each SAR so the register reflects final dispositions', 'Resolution status (submitted/declined/pending); submission date; reference number from FIU; audit event', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'FE+BE', 3, 'SAR Flag', '🔴 High', '❌ Not tested', null, 'https://www.notion.so/354bc99749638114adbcc56b111c6243', null],
    ['SAR / MLRO Workbench', 'SAR Export Audit', 'As the system, I emit an audit event for every SAR export so the action is traceable', 'audit_log entry on every goAML export; actor_id, entity_id, timestamp; immutable', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'BE', 1, 'goAML Export', '🔴 High', '❌ Not tested', null, 'https://www.notion.so/354bc99749638114adbcc56b111c6243', null],
    // ── Reporting & Audit ──
    ['Reporting & Audit', 'Audit Log', 'As an MLRO, I view an immutable audit log so every action is traceable for regulators', 'Hash-chained audit_log; no UPDATE/DELETE; export to JSON-L; verify:audit-chain CLI', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'BE', 8, 'None', '🔴 High', '✅ Tested', '#62', 'https://www.notion.so/354bc997496381859409e18351e70c9d', 'PR #62'],
    ['Reporting & Audit', 'Audit Export', 'As a tenant admin, I export audit logs so regulators can review them offline', 'JSON-L export of filtered audit log; date range filter; download as file', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'FE+BE', 3, 'Audit Log', '🔴 High', '❌ Not tested', null, 'https://www.notion.so/354bc997496381859409e18351e70c9d', null],
    ['Reporting & Audit', 'Monthly Report', 'As a tenant admin, I export a monthly compliance report so management has an overview', 'Automated monthly report covering approvals/rejections/SARs/screening hits; PDF or CSV export', 'P0-Critical', '❌ Missing', '✅ Required', '✅ Required', 'Sprint 2', 'BE+FE', 8, 'Audit Log', '🟡 Medium', '— N/A', null, 'https://www.notion.so/354bc997496381859409e18351e70c9d', null],
    // ── Notifications ──
    ['Notifications', 'Email (Resend)', 'As the system, I send transactional emails so customers and staff are notified of key events', 'Resend integration; no-op when API key unset; notification_events log; audit event on send', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'BE', 3, 'None', '🟢 Low', '✅ Tested', '#PRD', 'https://www.notion.so/354bc9974963816693ebc0477a448299', null],
    ['Notifications', 'Approval / Rejection Email', 'As a customer, I receive an email when my case is decided so I know the outcome', 'Approval email sent on approve action; rejection email with reason; idempotency key prevents duplicate sends', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'BE+FE', 3, 'Email (Resend)', '🟢 Low', '❌ Not tested', null, 'https://www.notion.so/354bc9974963816693ebc0477a448299', null],
    ['Notifications', 'Reviewer Notification', 'As a reviewer, I am notified when a case is assigned to me so I act promptly', 'Email + in-app notification on case assignment; digest option for high-volume queues', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'BE+FE', 3, 'Email (Resend)', '🟢 Low', '❌ Not tested', null, 'https://www.notion.so/354bc9974963816693ebc0477a448299', null],
    ['Notifications', 'Fallback Templates', 'As an MLRO, I can send manual emails using pre-built templates so communication is consistent', 'Template library for common comms; one-click send from case; logged to notification_events', 'P0-Critical', '❌ Missing', '✅ Required', '✅ Required', 'Sprint 2', 'FE', 3, 'Email (Resend)', '🟢 Low', '— N/A', null, 'https://www.notion.so/354bc9974963816693ebc0477a448299', null],
    ['Notifications', 'In-app Notifications', 'As any staff user, I see in-app notifications so I do not miss important events', 'Notification bell with unread count; real-time via Supabase Realtime; mark as read', 'P2-Medium', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'FE+BE', 8, 'Reviewer Notification', '🟢 Low', '— N/A', null, 'https://www.notion.so/354bc9974963816693ebc0477a448299', null],
    // ── Tenant Admin ──
    ['Tenant Admin / Workflow Config', 'Tenant Setup', 'As a platform admin, I create and configure tenants so new clients can be onboarded', 'Tenant creation with name/slug/plan; admin user invited; branding config; workflow template assigned', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'BE+FE', 5, 'None', '🟡 Medium', '✅ Tested', '#PRD', 'https://www.notion.so/354bc997496381748cfacd9359a1d48a', null],
    ['Tenant Admin / Workflow Config', 'Risk Threshold Config', 'As a tenant admin, I set risk thresholds so my firm\'s risk policy is enforced', 'Risk band thresholds (low/medium/high) configurable per tenant; applied to new assessments', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'FE+BE', 5, 'Tenant Setup', '🟡 Medium', '❌ Not tested', null, 'https://www.notion.so/354bc997496381748cfacd9359a1d48a', null],
    ['Tenant Admin / Workflow Config', 'MVP Templates', 'As a tenant admin, I select a pre-built workflow template so my firm can start quickly', 'DNFBP, Real Estate, CSP templates selectable; workflow versioned on select; cloneable', 'P0-Critical', '🟡 In Progress', '✅ Required', '✅ Required', 'Sprint 2', 'FE+BE', 5, 'Tenant Setup', '🟡 Medium', '❌ Not tested', null, 'https://www.notion.so/354bc997496381748cfacd9359a1d48a', 'DNFBP done #66; RE+CSP missing'],
    // ── API / SDK ──
    ['API / SDK / Integrations', 'Public REST API', 'As an integration partner, I call the TruVis REST API so I can embed compliance in my product', 'v1 REST API with auth (API key); key resources: customers, cases, documents, decisions; rate limited', 'P1-High', '🟡 In Progress', '— Not needed', '✅ Required', 'Sprint 3', 'BE', 13, 'None', '🔴 High', '— N/A', null, 'https://www.notion.so/354bc997496381c5b520fa369d9efefd', null],
    ['API / SDK / Integrations', 'Developer Portal', 'As a developer, I access API docs and a sandbox so I can integrate without support', 'OpenAPI spec published; interactive docs; sandbox tenant auto-provisioned on signup', 'P1-High', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'BE+FE', 13, 'Public REST API', '🔴 High', '— N/A', null, 'https://www.notion.so/354bc997496381c5b520fa369d9efefd', null],
    ['API / SDK / Integrations', 'Web SDK / Iframe', 'As an integration partner, I embed the onboarding flow in my product via SDK so UX is seamless', 'Embeddable iframe with tenant slug; JWT-secured events; completion callback', 'P2-Medium', '❌ Missing', '— Not needed', '✅ Required', 'Backlog', 'FE+BE', 13, 'Public REST API', '🟡 Medium', '— N/A', null, 'https://www.notion.so/354bc997496381c5b520fa369d9efefd', null],
    ['API / SDK / Integrations', 'Webhook Retry', 'As the system, I retry failed webhooks so no events are permanently lost', 'webhook_events queue; retry-failed-webhooks Edge Function; hourly pg_cron schedule; dead-letter after 5 fails', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'BE', 5, 'None', '🟡 Medium', '🟡 Partial', '#PRD', 'https://www.notion.so/354bc997496381c5b520fa369d9efefd', null],
    // ── Billing ──
    ['Billing / Commercial', 'Self-serve Signup', 'As a prospect, I sign up and provision my own tenant so sales cycles are eliminated', 'Public signup flow; email verification; tenant auto-created; free trial activated; plan selected', 'P1-High', '🟡 In Progress', '— Not needed', '✅ Required', 'Sprint 3', 'FE+BE', 13, 'Tenant Setup', '🔴 High', '— N/A', null, 'https://www.notion.so/354bc997496381c9a138d40cad7178be', 'SaaS launch gate'],
    ['Billing / Commercial', 'Subscription + Billing', 'As a tenant admin, I manage my subscription and pay online so the service is self-sustaining', 'Stripe/Nomod integration; plan enforcement; usage metering; invoice generation; payment page', 'P1-High', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'BE+FE', 13, 'Self-serve Signup', '🔴 High', '— N/A', null, 'https://www.notion.so/354bc997496381c9a138d40cad7178be', 'SaaS launch gate'],
    ['Billing / Commercial', 'Pilot Invoice', 'As a sales person, I generate a pilot invoice so the managed pilot is commercially documented', 'Invoice template (PDF); tenant + plan + duration + price; sent by email; stored in DB', 'P0-Critical', '❌ Missing', '✅ Required', '✅ Required', 'Sprint 2', 'Ops', 2, 'None', '🟢 Low', '— N/A', null, 'https://www.notion.so/354bc997496381c9a138d40cad7178be', null],
    ['Billing / Commercial', 'Pilot Agreement', 'As a sales person, I send a pilot agreement so legal terms are agreed before go-live', 'Agreement template (PDF/DocuSign); tenant details auto-filled; signed copy stored', 'P0-Critical', '❌ Missing', '✅ Required', '✅ Required', 'Sprint 2', 'Ops', 2, 'None', '🟢 Low', '— N/A', null, 'https://www.notion.so/354bc997496381c9a138d40cad7178be', null],
    // ── Continuous Monitoring ──
    ['Continuous Monitoring / KYT', 'Periodic Re-screen', 'As the system, I re-screen all customers monthly so ongoing monitoring is maintained', 'Cron job triggers re-screen for all active customers; new hits create alerts; MLRO notified', 'P0-Critical', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'BE', 13, 'Automated Monitoring', '🔴 High', '— N/A', null, null, 'SaaS launch gate'],
    ['Continuous Monitoring / KYT', 'Transaction Monitoring', 'As an MLRO, I monitor transaction patterns so unusual activity triggers a review', 'Transaction API ingestion; rule-based alerts; auto-case creation on threshold breach', 'P2-Medium', '❌ Missing', '— Not needed', '✅ Required', 'Backlog', 'BE', 21, 'Periodic Re-screen', '🔴 High', '— N/A', null, null, 'Complex — Sprint 3+'],
    ['Continuous Monitoring / KYT', 'Document Expiry Monitoring', 'As the system, I alert staff when customer documents are about to expire so renewal is triggered', 'Daily check for expiring docs; alert 30/7/1 days before; case or task created', 'P0-Critical', '❌ Missing', '✅ Required', '✅ Required', 'Sprint 2', 'BE', 5, 'Document Expiry Date', '🟡 Medium', '— N/A', null, null, null],
    // ── UAE Market Features ──
    ['UAE Market Features', 'UAE Compliance', 'As a UAE-regulated firm, I use CBUAE/DFSA/FSRA rule packs so I am compliant with local regulations', 'All three rule packs selectable; DNFBP template; goAML export; UAE Pass; Emirates ID', 'P0-Critical', '✅ Built', '✅ Required', '✅ Required', 'Sprint 1 Done', 'BE+FE', 8, 'None', '🟡 Medium', '✅ Tested', '#66 #73 #74', 'https://www.notion.so/354bc997496381669adcc34e4adc7cdf', 'PRs #66 #73 #74'],
    ['UAE Market Features', 'Real Estate Template', 'As a UAE real estate firm, I use a pre-built KYC workflow so I am compliant with RERA requirements', 'Real estate workflow template selectable; RERA-specific fields; document checklist for RE', 'P0-Critical', '❌ Missing', '✅ Required', '✅ Required', 'Sprint 2', 'FE+BE', 5, 'Tenant Setup', '🟡 Medium', '— N/A', null, 'https://www.notion.so/354bc997496381669adcc34e4adc7cdf', null],
    ['UAE Market Features', 'CSP Template', 'As a UAE corporate service provider, I use a pre-built workflow so I am compliant with Cabinet Decision 58', 'CSP workflow template; UBO resolution requirements; government entity screening', 'P0-Critical', '❌ Missing', '✅ Required', '✅ Required', 'Sprint 2', 'FE+BE', 5, 'Tenant Setup', '🟡 Medium', '— N/A', null, 'https://www.notion.so/354bc997496381669adcc34e4adc7cdf', null],
    ['UAE Market Features', 'Arabic UI / RTL', 'As an Arabic-speaking user, I navigate the portal in Arabic so the product is accessible in the UAE market', 'Full Arabic translation; RTL layout; no visual breakage; language toggle', 'P2-Medium', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'FE', 13, 'None', '🟡 Medium', '— N/A', null, 'https://www.notion.so/354bc997496381669adcc34e4adc7cdf', null],
    // ── Enterprise Trust ──
    ['Enterprise Trust / Ops', 'Sentry Monitoring', 'As ops, I monitor production errors in real time so incidents are detected and resolved quickly', 'Sentry DSN configured; error rate dashboards; on-call alerts; source maps on deploy', 'P1-High', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'Ops', 3, 'None', '🔴 High', '— N/A', null, null, 'SaaS launch gate'],
    ['Enterprise Trust / Ops', 'Privacy Centre', 'As a data subject, I can submit a DSAR so my privacy rights are honoured under PDPL', 'Privacy centre page; DSAR form; 30-day response SLA; data export or deletion workflow', 'P1-High', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'BE+FE', 8, 'None', '🟡 Medium', '— N/A', null, null, null],
    ['Enterprise Trust / Ops', 'SOC 2 Readiness', 'As an enterprise prospect, I receive SOC 2 evidence so I can complete vendor due diligence', 'SOC 2 Type II audit initiated; trust service criteria mapped; evidence collection started', 'P2-Medium', '❌ Missing', '— Not needed', '✅ Required', 'Backlog', 'Ops', 21, 'DR', '🔴 High', '— N/A', null, null, 'Long lead time — start now'],
    ['Enterprise Trust / Ops', 'DR Drill', 'As ops, I have verified backup restoration so data recovery is proven', 'Backup verification monthly; restore drill quarterly; RTO < 4h; RTO documented', 'P1-High', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'Ops', 5, 'None', '🔴 High', '— N/A', null, null, null],
    // ── SaaS Platformization ──
    ['SaaS Platformization', 'Self-serve Provisioning', 'As a prospect, I create my own tenant without sales involvement so time-to-value is < 5 minutes', 'Signup → email verify → tenant provisioned → onboarding wizard → live in < 5 min', 'P1-High', '❌ Missing', '— Not needed', '✅ Required', 'Sprint 3', 'FE+BE', 13, 'Self-serve Signup', '🟡 Medium', '— N/A', null, null, null],
    ['SaaS Platformization', 'White-label', 'As a tenant admin, I apply my brand so the portal matches my firm\'s identity', 'Custom logo, primary colour, email from-name; applied to all customer-facing surfaces', 'P2-Medium', '❌ Missing', '— Not needed', '✅ Required', 'Backlog', 'FE', 8, 'Tenant Setup', '🟢 Low', '— N/A', null, null, null],
    ['SaaS Platformization', 'Status Page', 'As any user, I check service status so I know about outages without contacting support', 'Public status page; automated incident posting from Sentry/UptimeRobot; subscription to updates', 'P2-Medium', '❌ Missing', '— Not needed', '✅ Required', 'Backlog', 'Ops', 3, 'Sentry Monitoring', '🟢 Low', '— N/A', null, null, null],
  ]
  return rows
}

// ─── Sheet 3: Sprint Board ────────────────────────────────────────────────────

function buildSprintBoard(): (string | number | null)[][] {
  return [
    ['🏃 Sprint Board — TruVis AML/KYC/CDD Portal', null, null, null, null, null, null, null],
    [],
    ['── SPRINT 1 (DONE — Apr 14 – May 6 2026) ──────────────────────────────────────'],
    ['Feature', 'Module', 'Owner', 'Points', 'Status', 'PR', 'Notes', null],
    ['Hash-chained audit log + verify CLI', 'Reporting & Audit', 'BE', 8, '✅ Done', '#62', null, null],
    ['Minimum EDD form (source of wealth/funds/activity)', 'Risk / CDD / EDD', 'FE+BE', 5, '✅ Done', '#63', null, null],
    ['Adverse media default-on at 85% confidence', 'Screening', 'BE', 3, '✅ Done', '#64', null, null],
    ['Manual Emirates ID field + Luhn parser', 'Identity Verification', 'FE+BE', 3, '✅ Done', '#65', null, null],
    ['UAE rule packs: CBUAE/DFSA/FSRA/DNFBP + workflow templates', 'UAE Market', 'BE', 8, '✅ Done', '#66', null, null],
    ['UAE Pass OIDC bridge (PKCE + JWKS + claims pre-fill)', 'Customer Onboarding', 'BE', 8, '✅ Done', '#73', null, null],
    ['goAML XSD-grade validation on SAR export + submit', 'SAR / MLRO', 'BE', 8, '✅ Done', '#74', null, null],
    ['Marketing cleanup (de-vendor API errors)', 'Platform Core', 'FE', 2, '✅ Done', '#78', null, null],
    ['Dashboard polish (sparklines, period toggle, empty states)', 'Dashboards', 'FE', 8, '✅ Done', '#78', null, null],
    ['E2E test harness (24 live scenarios + 10 MFA stubs)', 'QA', 'QA', 8, '✅ Done', '#78', null, null],
    ['Docs: TEST_SCENARIOS, SECURITY_OVERVIEW, API, PRICING, RELEASE_CHECKLIST', 'Docs', 'PM', 3, '✅ Done', '#79', null, null],
    [],
    ['── SPRINT 2 (ACTIVE — May 7–21 2026) ──────────────────────────────────────────'],
    ['Feature', 'Module', 'Owner', 'Points', 'Status', 'PR', 'Notes', null],
    ['Tenant isolation / RLS regression test suite', 'Platform Core', 'BE+QA', 8, '🟡 In Progress', null, 'P0 security gate', null],
    ['MFA enforcement for MLRO + Admin roles', 'Platform Core', 'BE+FE', 5, '🟡 In Progress', null, 'P0 security gate', null],
    ['SAR visibility restriction test (tipping-off)', 'Roles & Permissions', 'BE+QA', 3, '🔴 Not Started', null, 'P0 compliance', null],
    ['Read-only no-PII enforcement test', 'Roles & Permissions', 'BE+QA', 3, '🔴 Not Started', null, 'P0 compliance', null],
    ['Manual verification fallback (IDV)', 'Identity Verification', 'FE+BE', 5, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['Document rejection reason', 'Document Management', 'FE+BE', 3, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['Document expiry date capture + alerts', 'Document Management', 'FE+BE', 3, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['Document checklist by client type', 'Document Management', 'FE+BE', 5, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['Monthly manual re-screening workflow', 'Screening', 'BE', 8, '🔴 Not Started', null, 'P0 compliance', null],
    ['Document expiry monitoring (daily cron alerts)', 'Continuous Monitoring', 'BE', 5, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['CDD / EDD routing (medium→CDD, high→EDD)', 'Risk / CDD / EDD', 'BE', 3, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['SAR resolution workflow + audit event', 'SAR / MLRO', 'FE+BE', 3, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['Audit log export (JSON-L download)', 'Reporting & Audit', 'FE+BE', 3, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['Monthly compliance report export', 'Reporting & Audit', 'BE+FE', 8, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['Real Estate + CSP workflow templates', 'UAE Market', 'FE+BE', 5, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['Risk threshold + document config in tenant admin', 'Tenant Admin', 'FE+BE', 5, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['Approval / rejection email', 'Notifications', 'BE+FE', 3, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['Reviewer notification email', 'Notifications', 'BE+FE', 3, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['Manual fallback email templates', 'Notifications', 'FE', 3, '🔴 Not Started', null, 'P0 MVP gate', null],
    ['Pilot invoice + agreement templates', 'Billing / Commercial', 'Ops', 2, '🔴 Not Started', null, 'P0 commercial', null],
    [],
    ['── SPRINT 3 (PLANNED — May 22 – Jun 4 2026) ───────────────────────────────────'],
    ['Feature', 'Module', 'Owner', 'Points', 'Status', 'PR', 'Notes', null],
    ['Sentry integration + on-call runbook', 'Enterprise Trust', 'Ops', 3, '📋 Planned', null, 'SaaS gate', null],
    ['DR drill + backup verification', 'Enterprise Trust', 'Ops', 5, '📋 Planned', null, 'SaaS gate', null],
    ['Privacy centre / DSAR portal', 'Enterprise Trust', 'BE+FE', 8, '📋 Planned', null, 'PDPL compliance', null],
    ['SLA monitoring + breach alerts', 'Case Management', 'BE+FE', 5, '📋 Planned', null, 'SaaS gate', null],
    ['Bulk case actions', 'Case Management', 'FE+BE', 8, '📋 Planned', null, null, null],
    ['Public REST API v1 (auth + core resources)', 'API / SDK', 'BE', 13, '📋 Planned', null, 'SaaS gate', null],
    ['Developer portal + OpenAPI docs', 'API / SDK', 'BE+FE', 13, '📋 Planned', null, 'SaaS gate', null],
    ['Self-serve signup + trial provisioning', 'Billing / Commercial', 'FE+BE', 13, '📋 Planned', null, 'SaaS gate', null],
    ['Subscription + billing (Stripe/Nomod)', 'Billing / Commercial', 'BE+FE', 13, '📋 Planned', null, 'SaaS gate', null],
    ['Automated periodic re-screening (cron)', 'Continuous Monitoring', 'BE', 13, '📋 Planned', null, 'SaaS gate', null],
    ['Arabic UI / RTL', 'UAE Market', 'FE', 13, '📋 Planned', null, 'UAE market gate', null],
    ['In-app notifications (Realtime)', 'Notifications', 'FE+BE', 8, '📋 Planned', null, null, null],
    ['MFA seed v2 (E2E R-01 → R-10 live)', 'QA', 'QA', 5, '📋 Planned', null, 'Unblocks E2E stubs', null],
  ]
}

// ─── Sheet 4: Roadmap ─────────────────────────────────────────────────────────

function buildRoadmap(): (string | number | null)[][] {
  return [
    ['🗺️ Product Roadmap — TruVis AML/KYC/CDD Portal (May – Jul 2026)', null, null, null, null, null],
    [],
    ['Workstream', 'May 7–21 (Sprint 2)', 'May 22–Jun 4 (Sprint 3)', 'Jun 5–18', 'Jun 19–Jul 2', 'Jul 3–11'],
    ['Security & Isolation', 'RLS tests · MFA enforcement · SAR visibility · Read-only PII', 'Sentry · DR drill · Privacy centre', 'SOC 2 initiation', 'Pen test', '✅ Security gate'],
    ['Core Compliance', 'Doc rejection · Expiry · Checklist · Re-screen · CDD/EDD routing · SAR resolution', 'SLA alerts · Bulk actions · Perpetual KYC', 'Load testing', 'Final QA', '✅ Compliance gate'],
    ['Commercial', 'Pilot invoice · Pilot agreement', 'Self-serve signup · Trial provisioning', 'Stripe/Nomod billing · Plan enforcement', 'Usage metering · Invoices', '✅ Commercial gate'],
    ['API / SDK', '— (Sprint 3 prep)', 'REST API v1 · OpenAPI docs · Developer portal', 'SDK/iframe embed · Sandbox env', 'API rate limiting · API key mgmt', '✅ API gate'],
    ['UAE Market', 'Real Estate template · CSP template', 'Arabic UI/RTL · Local lists', 'Data residency evidence · Fintech template', 'UAE regulator review', '✅ UAE gate'],
    ['Monitoring / Ops', 'Doc expiry cron', 'Automated re-screening · KYT rules', 'Transaction monitoring · Auto-case', 'Alert tuning', '✅ Monitoring gate'],
    ['Notifications', 'Approval email · Reviewer notify · Fallback templates', 'In-app notifications · SMS stub', 'WhatsApp (optional)', '—', '✅ Comms gate'],
    [],
    ['🎯 MILESTONES', null, null, null, null, null],
    ['Milestone', 'Date', 'Gate Criteria', null, null, null],
    ['Tenant Zero (internal)', '09 May 2026', 'All Sprint 2 P0 items done; TruVis team onboards as first tenant', null, null, null],
    ['MVP Controlled Pilot', '30 May 2026', 'Sprint 2 + Sprint 3 P0 done; pilot invoice signed; 1-3 external tenants', null, null, null],
    ['UAE Market Pilot', '30 Jun 2026', 'All 6 SaaS launch gates PARTIAL or better; Arabic UI; UAE Pass confirmed', null, null, null],
    ['Public SaaS Launch', '11 Jul 2026', 'All 6 launch gates ✅ READY; billing live; developer portal; Sentry; SOC 2 started', null, null, null],
  ]
}

// ─── Sheet 5: MVP Checklist ───────────────────────────────────────────────────

function buildMVPChecklist(): (string | number | null)[][] {
  return [
    ['🎯 MVP Checklist — Controlled Managed Pilot (Target: 30 May 2026)', null, null, null, null],
    ['Feature', 'Module', 'Acceptance Criteria (brief)', 'Status', 'QA Sign-off'],
    // Access & Auth
    ['── ACCESS & AUTH ──────────────────────────────────────────────────────────'],
    ['Multi-tenant isolation (RLS)', 'Platform Core', 'E2E isolation test passes; no cross-tenant data leak', '🟡 In Progress', '❌'],
    ['Supabase Auth + JWT hook', 'Platform Core', 'Login works; JWT has tenant_id + user_role', '✅ Built', '✅'],
    ['MFA for MLRO + Admin', 'Platform Core', 'aal2 enforced; redirect to /mfa-setup if not verified', '🟡 In Progress', '❌'],
    ['6 role types with correct permissions', 'Roles & Permissions', 'Each role can access only their screens; 403 otherwise', '✅ Built', '🟡'],
    ['SAR visibility restricted to MLRO/Admin', 'Roles & Permissions', 'Analyst + Onboarding Agent cannot see SAR', '🟡 In Progress', '❌'],
    ['Read-only blocked from PII', 'Roles & Permissions', 'FORBIDDEN_FIELD_SET enforced; API test passes', '🟡 In Progress', '❌'],
    // Onboarding
    ['── CUSTOMER ONBOARDING ──────────────────────────────────────────────────'],
    ['Hosted onboarding link (individual KYC)', 'Customer Onboarding', 'Customer completes multi-step form; case created', '✅ Built', '🟡'],
    ['Corporate KYB + UBO form', 'Customer Onboarding', 'Corporate profile + trade licence + UBO submitted', '✅ Built', '🟡'],
    ['Consent capture', 'Customer Onboarding', 'Consent recorded with timestamp and version', '✅ Built', '✅'],
    ['Customer data versioning', 'Customer Onboarding', 'Each data change creates a new version row; no bare UPDATE', '✅ Built', '✅'],
    ['Session resume', 'Customer Onboarding', 'Customer can return and continue from last step', '🟡 In Progress', '❌'],
    // IDV
    ['── IDENTITY VERIFICATION ──────────────────────────────────────────────'],
    ['IDV Web SDK + applicant creation', 'Identity Verification', 'SDK renders; applicant created in provider; webhook received', '✅ Built', '🟡'],
    ['Manual Emirates ID field + validation', 'Identity Verification', 'Luhn check passes; stored; displayed in case', '✅ Built', '✅'],
    ['Manual verification fallback', 'Identity Verification', 'Analyst can override IDV result; reason recorded; audit event', '🟡 In Progress', '❌'],
    // Documents
    ['── DOCUMENT MANAGEMENT ──────────────────────────────────────────────────'],
    ['Document upload + Supabase Storage', 'Document Management', 'File uploaded to private bucket; signed URL max 15 min', '✅ Built', '✅'],
    ['Document hash + verification status', 'Document Management', 'SHA-256 stored; verified/rejected status on record', '✅ Built', '✅'],
    ['Document rejection reason', 'Document Management', 'Analyst enters reason; stored; customer notified', '🟡 In Progress', '❌'],
    ['Expiry date capture', 'Document Management', 'Date field on document record; alert cron configured', '🟡 In Progress', '❌'],
    ['Document checklist by client type', 'Document Management', 'Required docs shown to customer per client type config', '🟡 In Progress', '❌'],
    // Screening
    ['── SCREENING ─────────────────────────────────────────────────────────────'],
    ['Sanctions + PEP screening', 'Screening', 'Every customer screened on submit; hits stored', '✅ Built', '✅'],
    ['Adverse media (default on, 85%)', 'Screening', 'Adverse media enabled by default; threshold configurable', '✅ Built', '✅'],
    ['Screening hit resolution', 'Screening', 'Analyst accepts/rejects hits; reason required; audit event', '✅ Built', '🟡'],
    ['Monthly manual re-screening', 'Screening', 'MLRO can trigger re-screen for all active customers', '❌ Missing', '❌'],
    // Risk
    ['── RISK / CDD / EDD ──────────────────────────────────────────────────────'],
    ['Basic risk scoring + routing', 'Risk / CDD / EDD', 'Score computed; low/medium/high bands; case routed correctly', '✅ Built', '🟡'],
    ['Minimum EDD form', 'Risk / CDD / EDD', 'Source of wealth/funds/activity fields; saved on case', '✅ Built', '✅'],
    ['CDD / EDD routing', 'Risk / CDD / EDD', 'Medium→CDD queue; high→EDD queue + EDD form required', '🟡 In Progress', '❌'],
    // Case Management
    ['── CASE MANAGEMENT ───────────────────────────────────────────────────────'],
    ['Case creation + assignment', 'Case Management', 'Case auto-created from onboarding; assignable to analyst', '✅ Built', '✅'],
    ['Internal notes', 'Case Management', 'Notes added; visible to staff; audit event on each note', '✅ Built', '✅'],
    ['Request additional information (RAI)', 'Case Management', 'RAI action pauses case; customer notified; response received', '✅ Built', '✅'],
    ['Escalation', 'Case Management', 'Analyst escalates to SR or MLRO; audit trail', '✅ Built', '✅'],
    ['Approve / Reject decision', 'Case Management', 'Final decision locked; reason required; email sent to customer', '✅ Built', '🟡'],
    ['Case timeline / audit trail', 'Case Management', 'All transitions visible in timeline; immutable', '✅ Built', '✅'],
    // SAR
    ['── SAR / MLRO WORKBENCH ──────────────────────────────────────────────────'],
    ['SAR flag + register', 'SAR / MLRO', 'MLRO flags case as SAR; register page shows all SARs', '✅ Built', '✅'],
    ['SAR notes', 'SAR / MLRO', 'MLRO adds investigation notes; stored securely; MLRO-only visible', '✅ Built', '✅'],
    ['goAML XML export + XSD validation', 'SAR / MLRO', 'goAML XML generated; XSD validation passes; download works', '✅ Built', '✅'],
    ['SAR visibility / tipping-off masking', 'SAR / MLRO', 'Non-MLRO/Admin roles cannot see SAR flag or register', '🟡 In Progress', '❌'],
    ['SAR resolution workflow', 'SAR / MLRO', 'Resolution status recorded; FIU reference stored; audit event', '🟡 In Progress', '❌'],
    // Reporting
    ['── REPORTING & AUDIT ─────────────────────────────────────────────────────'],
    ['Aggregate reporting dashboard', 'Reporting & Audit', 'Approvals/rejections/SARs/hit rates shown per period', '✅ Built', '🟡'],
    ['Immutable audit log', 'Reporting & Audit', 'Hash-chained; no UPDATE/DELETE; verify:audit-chain passes', '✅ Built', '✅'],
    ['Audit log export (JSON-L)', 'Reporting & Audit', 'Date-range export downloadable; field-filtered', '🟡 In Progress', '❌'],
    ['Monthly compliance report export', 'Reporting & Audit', 'Report PDF/CSV covers key compliance metrics', '❌ Missing', '❌'],
    // Notifications
    ['── NOTIFICATIONS ─────────────────────────────────────────────────────────'],
    ['Email (Resend) integration', 'Notifications', 'Sends work; notification_events logged; no-op when key unset', '✅ Built', '✅'],
    ['Approval / rejection email to customer', 'Notifications', 'Email sent on decision; idempotency key prevents duplicate', '🟡 In Progress', '❌'],
    ['Reviewer notification on assignment', 'Notifications', 'Email sent when case assigned to reviewer', '🟡 In Progress', '❌'],
    ['Manual fallback email templates', 'Notifications', 'Template library accessible from case; one-click send', '❌ Missing', '❌'],
    // Tenant
    ['── TENANT ADMIN ──────────────────────────────────────────────────────────'],
    ['Manual tenant creation + user invite', 'Tenant Admin', 'Tenant created by platform admin; user invited by email', '✅ Built', '✅'],
    ['Role assignment', 'Tenant Admin', 'Admin assigns roles to users; JWT updated on next login', '✅ Built', '✅'],
    ['Required document config', 'Tenant Admin', 'Admin configures required docs per client type', '🟡 In Progress', '❌'],
    ['Risk threshold config', 'Tenant Admin', 'Admin sets low/medium/high thresholds; applied immediately', '🟡 In Progress', '❌'],
    ['Fixed MVP templates (DNFBP, Real Estate, CSP)', 'Tenant Admin', 'All 3 templates selectable; workflow versioned', '🟡 In Progress', '❌'],
    // Commercial
    ['── COMMERCIAL ────────────────────────────────────────────────────────────'],
    ['Pilot invoice template', 'Billing / Commercial', 'Invoice PDF generated with tenant + plan + price; emailed', '❌ Missing', '❌'],
    ['Pilot agreement template', 'Billing / Commercial', 'Agreement PDF/DocuSign; signed copy stored', '❌ Missing', '❌'],
  ]
}

// ─── Sheet 6: SaaS Launch Gates ──────────────────────────────────────────────

function buildSaaSGates(): (string | number | null)[][] {
  return [
    ['🚀 SaaS Launch Gates — Public Launch Criteria (Target: 11 Jul 2026)', null, null, null, null, null, null],
    ['Gate', 'Requirement', 'Detail / Acceptance Criteria', 'Owner', 'Target Date', 'Status', 'Blocker'],
    // Gate 1: Commercial
    ['── GATE 1: COMMERCIAL AUTOMATION ─────────────────────────────────────────────────────────'],
    ['Commercial', 'Self-serve signup', 'Prospect signs up online; tenant auto-provisioned; free trial activated', 'Product + BE', 'Jun 2026', '🔴 Not Started', 'No billing integration'],
    ['Commercial', 'Subscription management', 'Plan selection; Stripe/Nomod integration; card on file; auto-renewal', 'BE', 'Jun 2026', '🔴 Not Started', 'No payment provider chosen'],
    ['Commercial', 'Usage metering', 'API calls / active users / verified customers counted per billing period', 'BE', 'Jun 2026', '🔴 Not Started', null],
    ['Commercial', 'Invoice generation', 'PDF invoice auto-generated monthly; emailed to billing contact', 'BE', 'Jun 2026', '🔴 Not Started', null],
    ['Commercial', 'Plan enforcement', 'Tenant blocked from features beyond their plan; upgrade prompt shown', 'BE', 'Jun 2026', '🔴 Not Started', null],
    // Gate 2: API / SDK
    ['── GATE 2: API / SDK PLATFORM ─────────────────────────────────────────────────────────────'],
    ['API / SDK', 'Public REST API v1', 'Core resources (customers, cases, documents, decisions) accessible via API key; OpenAPI spec published', 'BE', 'Jun 2026', '🟡 In Progress', 'API not secured for public use'],
    ['API / SDK', 'Developer portal', 'Interactive API docs; sandbox tenant auto-provisioned on signup; rate limits visible', 'BE+FE', 'Jun 2026', '🔴 Not Started', null],
    ['API / SDK', 'API rate limiting', 'Per-tenant rate limits enforced; 429 response with Retry-After header', 'BE', 'Jun 2026', '🔴 Not Started', null],
    ['API / SDK', 'API key management', 'Tenant admin creates/revokes API keys in portal; keys scoped to permissions', 'BE+FE', 'Jun 2026', '🔴 Not Started', null],
    ['API / SDK', 'Webhook delivery', 'Event webhooks for case decisions, screening hits; retry with exponential backoff', 'BE', 'Jun 2026', '✅ Built (retry)', null],
    // Gate 3: Monitoring / KYT
    ['── GATE 3: CONTINUOUS MONITORING / KYT ────────────────────────────────────────────────────'],
    ['Continuous Monitoring', 'Automated periodic re-screening', 'Nightly/monthly cron re-screens all active customers; new hits alert MLRO', 'BE', 'Jun 2026', '🔴 Not Started', 'No cron infrastructure'],
    ['Continuous Monitoring', 'Document expiry monitoring', 'Daily check; alerts 30/7/1 days before expiry; case or task created', 'BE', 'May 2026', '🔴 Not Started', null],
    ['Continuous Monitoring', 'Risk change auto-case', 'Re-screen hit or external event triggers new case automatically', 'BE', 'Jun 2026', '🔴 Not Started', null],
    ['Continuous Monitoring', 'Adverse media feed', 'Continuous adverse media monitoring via provider; new hits alert within 24h', 'BE', 'Jun 2026', '🔴 Not Started', 'Provider contract needed'],
    // Gate 4: Security
    ['── GATE 4: SECURITY & TENANT ISOLATION ────────────────────────────────────────────────────'],
    ['Security', 'RLS regression suite', 'E2E tests verify no cross-tenant data leak; runs in CI', 'BE+QA', 'May 2026', '🔴 Not Started', 'Tests not written'],
    ['Security', 'MFA enforcement', 'MLRO and Admin roles cannot bypass MFA; aal2 checked in middleware', 'BE', 'May 2026', '🟡 In Progress', null],
    ['Security', 'SAR tipping-off prevention', 'Non-MLRO/Admin roles get 403 on all SAR routes; tested in CI', 'BE+QA', 'May 2026', '🟡 In Progress', null],
    ['Security', 'Service-role boundary audit', 'admin.ts import restricted to app/api/ only; ESLint rule enforced; verified', 'BE', 'May 2026', '✅ Built', null],
    ['Security', 'Penetration test', 'External pen test completed; critical findings resolved; report available', 'Ops', 'Jun 2026', '🔴 Not Started', 'Budget / vendor needed'],
    // Gate 5: Enterprise Trust
    ['── GATE 5: ENTERPRISE TRUST / OPS ────────────────────────────────────────────────────────'],
    ['Enterprise', 'Production monitoring (Sentry)', 'Sentry DSN; error rate alerts; on-call PagerDuty integration; source maps', 'Ops', 'Jun 2026', '🔴 Not Started', 'No Sentry yet'],
    ['Enterprise', 'Backup + DR drill', 'Daily backup verified; quarterly restore drill; RTO < 4h documented', 'Ops', 'Jun 2026', '🔴 Not Started', null],
    ['Enterprise', 'Privacy centre / DSAR', 'Public privacy centre; DSAR form; 30-day SLA; deletion workflow', 'BE+FE', 'Jun 2026', '🔴 Not Started', null],
    ['Enterprise', 'Incident response runbook', 'Runbook documented; on-call rotation defined; P1 SLA < 1h', 'Ops', 'Jun 2026', '🟡 Partial (stub)', null],
    ['Enterprise', 'SLA definitions', 'Uptime SLA (99.5%); response time SLA; escalation path published', 'Ops', 'Jun 2026', '🔴 Not Started', null],
    ['Enterprise', 'SOC 2 audit initiated', 'Audit firm engaged; trust service criteria scoped; evidence collection started', 'Ops', 'Jun 2026', '🔴 Not Started', 'Long lead time'],
    // Gate 6: UAE
    ['── GATE 6: UAE LOCALIZATION ───────────────────────────────────────────────────────────────'],
    ['UAE', 'Arabic UI / RTL', 'Full Arabic translation; RTL layout; language toggle; no layout breakage', 'FE', 'Jun 2026', '🔴 Not Started', null],
    ['UAE', 'Local sanctions lists', 'UAE local lists (CBUAE, OFAC UAE) integrated; screened alongside global', 'BE', 'Jun 2026', '🔴 Not Started', 'List access needed'],
    ['UAE', 'Data residency evidence', 'Supabase region me1 (Bahrain) confirmed; data flow diagram; DPA signed', 'Ops+Legal', 'Jun 2026', '🟡 Partial', 'DPA not signed'],
    ['UAE', 'goAML FIU submission', 'goAML XSD-valid XML submittable to UAE FIU; submission tracking; confirmation', 'BE', 'Jun 2026', '✅ XSD done', 'Submission flow not tested'],
    ['UAE', 'Fintech template', 'Fintech sector workflow template selectable; CBUAE-aligned fields', 'FE+BE', 'Jun 2026', '🔴 Not Started', null],
  ]
}

// ─── Sheet 7: Risk Register ───────────────────────────────────────────────────

function buildRiskRegister(): (string | number | null)[][] {
  return [
    ['⚠️ Risk Register — TruVis AML/KYC/CDD Portal', null, null, null, null, null, null, null, null, null],
    ['Risk ID', 'Risk', 'Category', 'Likelihood (1-5)', 'Impact (1-5)', 'Score', 'Mitigation', 'Owner', 'Status', 'Due Date'],
    ['R-01', 'Cross-tenant data leak via missing RLS policy', 'Security', 5, 5, 25, 'Write RLS regression E2E suite; CI gate; pen test', 'BE+QA', '🔴 Open', 'May 21 2026'],
    ['R-02', 'MFA bypassed by privileged roles (MLRO/Admin)', 'Security', 4, 5, 20, 'Enforce aal2 in middleware; E2E test MFA bypass attempt', 'BE', '🔴 Open', 'May 21 2026'],
    ['R-03', 'SAR data visible to non-MLRO roles (tipping-off violation)', 'Compliance', 4, 5, 20, '403 on all SAR routes for non-MLRO; CI test', 'BE+QA', '🔴 Open', 'May 21 2026'],
    ['R-04', 'No production monitoring — silent failures undetected', 'Operations', 4, 4, 16, 'Integrate Sentry; configure alerts; on-call rotation', 'Ops', '🔴 Open', 'Jun 4 2026'],
    ['R-05', 'No automated re-screening — ongoing monitoring gap', 'Compliance', 4, 4, 16, 'Build cron re-screen in Sprint 3; test on staging', 'BE', '🔴 Open', 'Jun 4 2026'],
    ['R-06', 'goAML FIU submission untested end-to-end', 'Compliance', 3, 5, 15, 'Test submission with UAE FIU sandbox; confirm acceptance', 'BE+Ops', '🟡 Mitigating', 'Jun 2026'],
    ['R-07', 'Billing not live — SaaS revenue impossible without payment', 'Commercial', 5, 3, 15, 'Integrate Stripe/Nomod in Sprint 3; test full payment flow', 'BE+Product', '🔴 Open', 'Jun 4 2026'],
    ['R-08', 'No DR drill — data recovery unproven', 'Operations', 3, 5, 15, 'Schedule restore drill; document RTO/RPO; automate verification', 'Ops', '🔴 Open', 'Jun 2026'],
    ['R-09', 'Arabic UI 0% — UAE market positioning weakened', 'Market', 4, 3, 12, 'Allocate FE sprint to RTL; use i18n framework', 'FE', '🔴 Open', 'Jun 2026'],
    ['R-10', 'API not public — integration partners cannot connect', 'Product', 3, 4, 12, 'Build REST API v1 in Sprint 3; OpenAPI spec; sandbox', 'BE', '🔴 Open', 'Jun 4 2026'],
    ['R-11', 'SOC 2 not started — enterprise sales cycle blocked', 'Commercial', 2, 4, 8, 'Engage audit firm; map trust criteria; start evidence collection', 'Ops', '🔴 Open', 'Jun 2026'],
    ['R-12', 'Document expiry not monitored — compliance gap', 'Compliance', 4, 2, 8, 'Build daily cron check in Sprint 2; test alert delivery', 'BE', '🟡 Sprint 2', 'May 21 2026'],
    ['R-13', 'PII in logs — regulatory violation', 'Privacy', 2, 5, 10, 'check:pii CI gate; no names/DOBs in audit_log; code review', 'BE', '✅ Mitigated', 'Ongoing'],
    ['R-14', 'Signed URL cached — document leak risk', 'Security', 2, 4, 8, 'Max 15-min TTL enforced; no caching headers; lint rule', 'BE', '✅ Mitigated', 'Ongoing'],
  ]
}

// ─── Sheet 8: Module Health ───────────────────────────────────────────────────

function buildModuleHealth(): (string | number | null)[][] {
  return [
    ['📊 Module Health Dashboard — TruVis AML/KYC/CDD Portal', null, null, null, null, null, null, null, null, null, null],
    ['Module', 'Total Features', '✅ Built', '🟡 In Progress', '❌ Missing', '% Complete', 'MVP Required', 'MVP Built', 'MVP %', 'SaaS Required', 'Sprint 2 Target', 'Owner'],
    ['Platform Core', 9, 3, 3, 3, '50%', 6, 3, '50%', 9, 2, 'BE'],
    ['Roles & Permissions', 10, 7, 3, 0, '85%', 9, 7, '78%', 10, 2, 'BE+QA'],
    ['Customer Onboarding', 10, 5, 2, 3, '60%', 7, 5, '71%', 10, 1, 'FE+BE'],
    ['Identity Verification', 9, 6, 1, 2, '72%', 7, 6, '86%', 9, 1, 'FE+BE'],
    ['Document Management', 9, 4, 3, 2, '61%', 7, 4, '57%', 9, 3, 'FE+BE'],
    ['Screening & Monitoring', 11, 6, 0, 5, '55%', 7, 6, '86%', 11, 1, 'BE'],
    ['Risk / CDD / EDD', 11, 8, 2, 1, '82%', 9, 8, '89%', 11, 1, 'BE'],
    ['Case Management', 13, 9, 0, 4, '69%', 9, 9, '100%', 13, 0, 'FE+BE'],
    ['SAR / MLRO Workbench', 10, 6, 3, 1, '75%', 8, 6, '75%', 10, 2, 'FE+BE'],
    ['Reporting & Audit', 10, 7, 1, 2, '75%', 8, 7, '88%', 10, 2, 'FE+BE'],
    ['Notifications', 8, 3, 2, 3, '50%', 6, 3, '50%', 8, 3, 'FE+BE'],
    ['Tenant Admin / Workflow Config', 11, 6, 2, 3, '64%', 8, 6, '75%', 11, 3, 'FE+BE'],
    ['API / SDK / Integrations', 8, 3, 1, 4, '44%', 3, 3, '100%', 8, 0, 'BE'],
    ['Billing / Commercial', 11, 0, 3, 8, '14%', 3, 0, '0%', 11, 2, 'BE+Product'],
    ['Continuous Monitoring / KYT', 7, 0, 0, 7, '0%', 2, 0, '0%', 7, 1, 'BE'],
    ['UAE Market Features', 16, 10, 0, 6, '63%', 9, 10, '111%', 16, 2, 'FE+BE'],
    ['Enterprise Trust / Ops', 8, 0, 1, 7, '6%', 1, 0, '0%', 8, 0, 'Ops'],
    ['SaaS Platformization', 8, 0, 0, 8, '0%', 0, 0, '—', 8, 0, 'FE+BE'],
    [],
    ['TOTALS', 179, 83, 27, 69, '54%', 109, 83, '76%', 179, 26, null],
  ]
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Building new Command Center workbook…')

  const auth = buildAuth()
  const wb = XLSX.utils.book_new()

  addSheet(wb, '📊 Command Center', buildCommandCenter())
  console.log('  ✅ Sheet 1: Command Center')

  addSheet(wb, '📋 BRD Feature Registry', buildBRD())
  console.log('  ✅ Sheet 2: BRD Feature Registry')

  addSheet(wb, '🏃 Sprint Board', buildSprintBoard())
  console.log('  ✅ Sheet 3: Sprint Board')

  addSheet(wb, '🗺️ Roadmap', buildRoadmap())
  console.log('  ✅ Sheet 4: Roadmap')

  addSheet(wb, '🎯 MVP Checklist', buildMVPChecklist())
  console.log('  ✅ Sheet 5: MVP Checklist')

  addSheet(wb, '🚀 SaaS Launch Gates', buildSaaSGates())
  console.log('  ✅ Sheet 6: SaaS Launch Gates')

  addSheet(wb, '⚠️ Risk Register', buildRiskRegister())
  console.log('  ✅ Sheet 7: Risk Register')

  addSheet(wb, '📊 Module Health', buildModuleHealth())
  console.log('  ✅ Sheet 8: Module Health')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  console.log(`\nUploading ${Math.round(buf.length / 1024)} KB to Google Drive…`)
  await uploadXlsx(auth, buf)
  console.log('✅ Command Center rebuilt and uploaded successfully.')
  console.log(`   Open: https://docs.google.com/spreadsheets/d/${FILE_ID}/edit`)
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
