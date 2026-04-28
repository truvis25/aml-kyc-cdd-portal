# PRD vs Built — Gap Analysis & Finalization Plan

**Author:** Senior PM review
**Date:** 2026-04-28
**Branch:** `claude/review-prd-competitor-lHhBJ`
**Scope:** Compare PRD v1.0 + Dev Plan v1.0 against current `main` implementation, benchmark against Sumsub and Azakaw, and recommend a roadmap to ship a competitive UAE/GCC-focused KYC/KYB SaaS.

> Note: the user mentioned "screenshots of the client dashboard." Those did not arrive in the message. This analysis is grounded in the PRD docs, the codebase, and public competitor material only. If the screenshots are re-shared, the recommendations in §6 should be revisited.

---

## 1. Executive Summary

**Where we are.** The MVP defined in `KYC AML Development Plan v1.docx §1.1` is functionally complete. All 10 MVP modules (M-01, M-02, M-07, M-08, M-09, M-10, M-11, M-12, M-13, M-15-basic) are wired end-to-end in `modules/`, `app/api/`, and `app/(platform)/`, on top of 32 migrations with RLS on every tenant-scoped table, an immutable audit log, and a Postgres-hook JWT enrichment. KYB (M-03) and the corporate workflow branch are also live — that's ahead of the dev plan, which deferred KYB to Phase 2.

**Where the gap is.** What we have is a compliant, well-architected **internal compliance tool**. What Sumsub and Azakaw sell is a **vendor-grade SaaS platform** where the differentiation lives in:

1. **Identity verification depth** (document/country breadth, liveness, biometric, anti-deepfake) — we have a webhook stub only.
2. **Region-specific regulator fit** (UAE Pass, Emirates ID, goAML STR submission, Arabic UI) — we have none.
3. **Distribution surface** (Web SDK, Mobile SDK, no-code Workflow Builder UI, public API docs/sandbox) — we have a REST API only, no SDKs, no visual builder.
4. **Ongoing monitoring** (M-14) — entirely missing.

To compete with Sumsub *globally* is a multi-year undertaking. To beat Azakaw *in UAE/GCC* is a 2-3 quarter focused build because their moat is regulator fit, not technology depth — and we already chose `me1` (Bahrain) for that posture.

**Recommended posture:** position as a **UAE/GCC-native, white-label compliance platform for regulated FIs and DNFBPs**. Don't try to out-Sumsub Sumsub. Out-Azakaw Azakaw on technical quality + workflow flexibility, then expand selectively.

---

## 2. PRD Module-by-Module Status

Status legend: ✅ BUILT (production-grade) · 🟡 PARTIAL (working but limited) · 🟠 STUB (placeholder) · ❌ MISSING

| # | Module (PRD) | MVP Required? | Status | Evidence | Gap to "PRD-complete" |
|---|---|---|---|---|---|
| M-01 | Onboarding Orchestrator | Yes | ✅ | `modules/onboarding/engine.ts`, `app/(onboarding)/[tenantSlug]/onboard/...` | A/B testing, drop-off analytics (Phase 2/Enterprise per PRD §3.1) |
| M-02 | Individual KYC | Yes | 🟡 | `modules/kyc-individual/`, `app/api/customers/` | Data + docs ✅. Liveness, biometric face match, OCR, MRZ, doc authenticity = **❌** |
| M-03 | Corporate KYB | Phase 2 | ✅ | `modules/kyb/`, migration 0020 | Registry API lookup ❌. Visual ownership tree ❌ |
| M-04 | UBO Engine | Phase 2 | ❌ | — | No UBO table, no recursive resolution, no listed-entity exemption flow |
| M-05 | CDD | Yes | 🟡 | Implicit in workflow → "standard" queue | No explicit CDD data package distinct from KYC; works because risk routing uses queues |
| M-06 | EDD | Yes | 🟡 | "edd" queue routing in cases | No EDD data form (source of wealth, narrative, audited financials). Risk band routes the case but doesn't change the form. |
| M-07 | Screening | Yes (sanctions+PEP) | 🟡 | `modules/screening/adapters/{complyadvantage,mock}.ts` | ComplyAdvantage adapter ✅. Adverse media, custom watchlists, batch re-screening = **❌** |
| M-08 | Risk Scoring | Yes (3-dim) | ✅ (3-dim) / 🟡 (5-dim) | `modules/risk/dimensions/{customer,geographic,product}.ts` | Channel + Relationship dimensions ❌. Tenant-configurable weights ❌. ML calibration ❌ |
| M-09 | Document Management | Yes | ✅ | `modules/documents/`, signed URLs, async hash | OCR + auto-validation ❌. Expiry alerts ❌. Re-request flow exists via RAI (good) |
| M-10 | Case Management | Yes | ✅ | `modules/cases/`, queue routing, RAI | SLA breach alerts ❌. Bulk decisions ❌. Case linking ❌ |
| M-11 | Approval Workflow | Yes (single-stage) | ✅ | `modules/approvals/` | Multi-stage, parallel paths, override audit, MLRO mandatory rules ❌ |
| M-12 | Audit Trail | Yes | ✅ | `modules/audit/`, append-only trigger, /24 IP masking | Hash chaining for tamper evidence ❌ (PRD §5.5). WORM S3 backup ❌ |
| M-13 | Consent | Yes | ✅ | `modules/consent/`, migration 0009 | Consent withdrawal halt-processing flow ❌. DSR (access/erasure) ❌ |
| M-14 | Ongoing Monitoring | Phase 2 | ❌ | Feature flag in `admin-config/types.ts` only | No scheduled re-KYC, no document-expiry monitor, no registry-change watcher, no adverse media post-onboarding |
| M-15 | Admin Config + Workflow Builder | Yes (basic) | 🟡 | `modules/admin-config/`, `app/(platform)/admin/` | Config CRUD ✅. Branding ✅. **Visual no-code workflow builder ❌** — flows are JSON-edited |
| Cross | Notifications | — | ✅ (email) | `modules/notifications/` Resend | SMS, WhatsApp, in-app push ❌ |
| Cross | Reporting/Analytics | Yes (basic) | 🟡 | `modules/reporting/queries.ts` | Snapshot only, no real-time, no SAR/STR export, no goAML XML |
| Cross | Webhooks infra | — | ✅ | `webhook_events`, retry job, edge functions | OK |

**Headline:** PRD-MVP is met on paper. The two material blockers to a real production launch are **(a) IDV is a stub** and **(b) M-14 ongoing monitoring is absent**. Everything else listed above is "Phase 2/Enterprise per PRD" and not blocking go-live.

---

## 3. Competitor Benchmark — What We're Up Against

### 3.1 Sumsub (global leader)

| Capability | Sumsub | Us | Strategic call |
|---|---|---|---|
| Document types / countries | 14,000+ docs · 220+ countries · OCR in 40+ languages | None (no IDV) | **Buy not build.** Use Sumsub or Onfido as our IDV provider; don't try to replicate. |
| Liveness + biometric face match | Built-in, deepfake detection ("For Fake's Sake") | None | **Provider-supplied.** |
| NFC e-passport read | Mobile SDK | None | Defer until Mobile SDK milestone. |
| Non-Doc Verification | US + 40 countries (phone-DB-based) | None | Defer; not a UAE play. |
| Reusable KYC | Cross-client identity reuse | None | Defer; ecosystem play, not viable for a new entrant. |
| KYB + UBO discovery | 200+ countries cached registries, recursive UBO | KYB form ✅, UBO ❌ | **Build M-04** + integrate one or two UAE/GCC registry APIs. |
| AML screening | PEP, sanctions, adverse media, ongoing | Sanctions+PEP via ComplyAdvantage ✅, adverse media ❌, ongoing ❌ | **Activate adverse media** in our existing adapter; **build M-14**. |
| Transaction monitoring | 300+ rules, AI, crypto Travel Rule | Not in MVP | Out of scope. Optional Phase 3+. |
| Fraud / device intel | Fingerprint partnership | None | Defer; partner integration when needed. |
| Case management | Built-in CMS | ✅ (parity-ish) | Already strong. Add SLA breach + bulk tools. |
| Workflow Builder | No-code visual, conditional, sandbox | JSON editing only | **Build visual builder UI** — high marketing value. |
| SDKs | REST + Web SDK + Mobile SDK (iOS/Android) | REST only | **Build Web SDK first** (drop-in iframe + JS lib). Mobile later. |
| Pricing visibility | $1.35–$1.85/verification, public | n/a | Decide our pricing model (§6). |
| Compliance certs | SOC 2 Type II, ISO 27001/27017/27701, GDPR | None publicly | **Plan SOC 2 + ISO 27001** as a 12-month track. |
| Differentiator | Travel Rule, Reusable KYC, deepfake | — | We don't beat them here. Don't try. |

### 3.2 Azakaw (UAE/GCC competitor — our actual target)

| Capability | Azakaw | Us | Strategic call |
|---|---|---|---|
| UAE Pass integration | ✅ | ❌ | **Build.** Highest UAE moat. |
| Emirates ID OCR/validation | ✅ | ❌ | **Build** (or via IDV provider that supports it). |
| Thiqah / Yakeen / Absher (KSA) | ✅ | ❌ | Phase 2 — KSA expansion. |
| goAML STR/SAR submission | ✅ native | Manual SAR flag only | **Build XML export + submission flow.** Required for UAE-licensed tenants. |
| DFSA / FSRA / CBUAE rule packs | ✅ pre-mapped | ❌ | **Build template library** (PRD §8.3 already specs this). |
| Arabic UI | ✅ | ❌ | **Build i18n + RTL.** Table stakes. |
| Video KYC | ✅ | ❌ | Phase 2; needs regulatory pre-approval. |
| UAE NRA mapping | ✅ | ❌ | **Build** as configuration overlay. Differentiator. |
| Vertical packs (banking, CSP, real estate, crypto) | ✅ | Generic only | **Build template library** (M-15 PRD §8.3). |
| Modular activation | ✅ | Partial (feature flags exist) | Lift this to a tenant-facing toggle UI. |

**The Azakaw gap is closeable in 2-3 quarters.** Their tech is not deeper than ours; their moat is regulatory packaging.

---

## 4. What We've Built That They Don't Talk About

These are real strengths to lean on in marketing:

1. **Audit-first architecture.** Every mutation emits an immutable event; audit-write failures roll back the transaction. PRD §5.5 evidentiary standards. Sumsub/Azakaw don't market this depth.
2. **RLS on every table + per-tenant config versioning.** True multi-tenant isolation at the DB layer.
3. **JWT enrichment via Postgres hook (C-02).** Cleaner than most SaaS auth designs; supports tight RLS without per-request lookups.
4. **Adapter pattern for screening.** We can swap ComplyAdvantage for Dow Jones / Refinitiv / WorldCheck without touching business logic.
5. **`me1` (Bahrain) data residency.** UAE/GCC posture out of the box. Sumsub is EU/US; Azakaw doesn't publish region detail.
6. **Versioned customer/business data + workflow definitions.** Append-only — replays are deterministic.

---

## 5. Recommended Roadmap to "Finalize"

Three quarters, three themes. Each milestone has a clear ship gate.

### M5 — "Ship-ready Compliance" (Q2 2026, ~6 weeks)

Goal: pass a regulator demo and onboard the first paying UAE tenant.

| # | Item | PRD Ref | Notes |
|---|---|---|---|
| 5.1 | **IDV integration — finish Sumsub adapter** | M-02 | Real HMAC verify, write to `kyc_results` table (new), surface result in case UI. The webhook handler exists; finish the processor. |
| 5.2 | **Adverse media in screening adapter** | M-07 Phase 2 | One config flag in ComplyAdvantage adapter; surface in hits UI. |
| 5.3 | **Ongoing monitoring v1** | M-14 | pg_cron → re-screen all approved customers monthly; document expiry alerts; emit `audit_log` event per re-screen. |
| 5.4 | **goAML STR XML export** | §7.3 | MLRO clicks "Export goAML XML" on a SAR-flagged case; produces FIU-compliant XML. Not auto-submission — that needs FIU credentials per tenant. |
| 5.5 | **Hash-chained audit log** | §5.5 | Add `prev_hash` column; trigger computes `sha256(prev_hash + row)`. |
| 5.6 | **Arabic UI + RTL** | §8.3 | i18n via `next-intl`, mirror layout, Arabic copy for onboarding + emails. |
| 5.7 | **EDD form** | M-06 | Risk-band-driven form: source of wealth, source of funds narrative, audited financials upload. |

**Ship gate:** end-to-end Arabic onboarding with real Sumsub IDV, monthly re-screening, goAML export, hash-chained audit.

### M6 — "Vendor-grade SaaS" (Q3 2026, ~8 weeks)

Goal: package as a sellable platform, not just an internal tool.

| # | Item | PRD Ref | Notes |
|---|---|---|---|
| 6.1 | **Public API + OpenAPI docs + sandbox** | §7.1 | We have the REST surface; document it, version it (`/v1`), publish at `/docs/api`, expose sandbox tenant. |
| 6.2 | **Web SDK (drop-in)** | §3.1 | JS lib + iframe embed for the customer-facing onboarding flow. Tenants paste 3 lines. |
| 6.3 | **Visual Workflow Builder UI** | M-15, §8.2 | React Flow over the existing JSON schema. Drag-drop steps, conditional logic, sandbox preview. The data model is there; this is UI. |
| 6.4 | **UBO Engine (M-04)** | M-04 | Recursive UBO resolution, ownership tree visualization, listed-entity exemption flow. |
| 6.5 | **Multi-stage approvals + parallel paths** | M-11 Phase 2 | Dual-reviewer + MLRO sign-off on EDD; configurable per risk band. |
| 6.6 | **Industry template library** | §8.3 | Ship 4 templates: UAE Fintech, ADGM Corporate, DIFC FI, KSA Bank. Tenant clones + customizes. |
| 6.7 | **SLA tracking + breach alerts** | M-10 Phase 2 | SLA per queue × risk band, breach triggers email + dashboard widget. |

**Ship gate:** a prospect can sign up, paste an embed snippet, pick a template, and run a test customer through end-to-end without touching code.

### M7 — "Regional Differentiation" (Q4 2026, ~10 weeks)

Goal: lock in UAE/GCC as our competitive moat.

| # | Item | Notes |
|---|---|---|
| 7.1 | **UAE Pass integration** | OAuth-style identity flow, returns verified Emirates ID + name. |
| 7.2 | **DFSA / FSRA / CBUAE rule packs** | Pre-configured workflow templates with regulator-specific fields, retention, EDD triggers. |
| 7.3 | **UAE NRA mapping** | Tenant config screen mapping their controls to UAE National Risk Assessment categories. Marketing-grade. |
| 7.4 | **Mobile capture (PWA first, native SDK later)** | PWA with camera + liveness via IDV provider; native iOS/Android SDK in a follow-up. |
| 7.5 | **SOC 2 Type I scoping** | 12-month track to Type II; Type I is ~3 months and unblocks enterprise sales. |
| 7.6 | **Data subject rights workflow** | Self-service export + erasure-request intake (PDPL/DPR). |
| 7.7 | **Vertical packs** | DNFBP, real estate, crypto/VARA — each is a template + risk weight overlay + doc bundle. |

**Out of scope (still):** transaction monitoring, blockchain/Travel Rule screening, ML risk calibration, video KYC. Defer until first paying tenant asks.

---

## 6. Open Questions for the User

These need decisions before M5 starts; I'm flagging them rather than guessing.

1. **IDV provider choice.** The webhook handler is named for Sumsub. Is Sumsub the locked-in choice, or do we want adapter-pattern parity (Sumsub + Onfido + Veriff) to negotiate pricing? Recommendation: ship with Sumsub, add adapter pattern after first paying tenant.
2. **Pricing model.** Per-verification (Sumsub-style, $1.35-$1.85), per-seat (Azakaw-style), or hybrid? This drives metering plumbing we'd build in M6.
3. **First tenant profile.** Are we onboarding TruVis itself, a friendly UAE fintech, an ADGM CSP, or a DIFC bank? The choice changes which template we ship first in M5.6/6.6.
4. **SAR submission depth.** XML export only (M5.4) vs. direct goAML API submission (would need each tenant's FIU credentials and probably regulator no-objection). Recommendation: XML export now, direct submission only after a tenant explicitly asks.
5. **Arabic — language only, or full RTL re-skin?** RTL is non-trivial for the case workbench. Recommendation: Arabic copy + RTL on customer-facing onboarding (M5.6); platform/admin UI stays LTR until a tenant requests it.
6. **The missing screenshots.** Do they show our current dashboard or a target dashboard from a client? That changes whether they're feedback on what's built or a feature spec for what's next.

---

## 7. Bottom Line

- **MVP per Dev Plan v1.0 = done.** Ahead of plan on KYB; behind on IDV (stub) and ongoing monitoring (missing).
- **To compete with Azakaw in UAE/GCC: ~2 quarters of focused work** on IDV completion, Arabic, goAML, UAE Pass, regulator templates, ongoing monitoring. All concrete. All in-scope per the PRD already.
- **To compete with Sumsub globally: don't.** Use them as our IDV provider. Differentiate on UAE/GCC fit, audit quality, multi-tenant rigor, white-label depth, and the visual workflow builder.
- **Three things to start this week:** finish IDV processor (5.1), enable adverse media (5.2), and stand up the monthly re-screen pg_cron job (5.3). Each is small and unblocks the M5 ship gate.
