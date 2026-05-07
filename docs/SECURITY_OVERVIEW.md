# Security Overview — AML/KYC/CDD Portal

> Classification: Public-facing  
> Maintained by: Engineering + Compliance · TruVis International Services  
> Last reviewed: 2026-05-07

This document describes the security architecture and controls of the TruVis AML/KYC/CDD Portal. It is intended for prospects, tenants, and auditors conducting due diligence.

---

## Data Residency

All customer data is processed and stored in the UAE/GCC region:

- **Application layer:** Vercel Edge Network — region `me1` (Bahrain). No data transits outside the GCC region for processing.
- **Database:** Supabase Postgres — provisioned in a region aligned with UAE data residency requirements (PDPL / ADGM DPR / DIFC PDPL).
- **File storage:** Supabase Storage in the same regional project.
- **Email delivery:** Resend. Email metadata only; no customer PII is embedded in transit.

---

## Encryption

| Layer | At rest | In transit |
|---|---|---|
| Database | AES-256 (Supabase managed) | TLS 1.2+ enforced |
| File storage | AES-256 (Supabase managed) | TLS 1.2+ enforced |
| Application secrets | Encrypted at rest in Vercel + GitHub Actions secret stores | N/A |
| JWT tokens | HMAC-SHA256 signed (Supabase Auth) | TLS |

---

## Authentication and Access Control

- **Authentication provider:** Supabase Auth (email + password).
- **MFA:** TOTP MFA is enforced for high-privilege roles (`platform_super_admin`, `tenant_admin`, `mlro`). Optional for lower-privilege roles.
- **JWT enrichment:** A Postgres Custom Access Token Hook (`custom_access_token_hook`) adds `tenant_id`, `role`, and `mfa_verified` claims to every JWT at mint time — no external service call required.
- **RBAC:** Role-based access control is checked at two layers: (1) Next.js middleware (JWT claims) and (2) each API route handler (`assertPermission`). A request that bypasses middleware is still blocked at the route.
- **Session management:** Supabase handles token refresh. Sessions are revoked server-side on user deactivation.

---

## Multi-Tenant Isolation (Row-Level Security)

Every tenant-scoped database table has:

1. **`tenant_id` column** — set on insert; never writable by client-side code.
2. **Postgres Row-Level Security (RLS) enabled** — enforced at the database layer regardless of how data is queried.
3. **pgTAP test coverage** — every RLS policy has a positive case (correct tenant can read) and a negative case (wrong tenant gets zero rows). Tests live in `tests/db/`.

A compromised application layer cannot leak cross-tenant data because RLS is enforced by Postgres before any row is returned. The service-role client (`lib/supabase/admin.ts`) that bypasses RLS is never imported in `app/` — enforced by a CI lint guard.

---

## Audit Trail

- **Append-only:** The `audit_log` table has a Postgres trigger that blocks `UPDATE` and `DELETE`. No application code, including service-role queries, can modify audit records.
- **Hash chain:** Every audit row includes a `row_hash` and `prev_hash` that cryptographically link each event to the previous one. The chain can be verified at any time via `npm run verify:audit-chain`.
- **No PII in logs:** Application logs (Vercel, Supabase edge function logs) contain only identifiers (`customer_id`, `session_id`, `case_id`). A `check:pii` script is run on every CI commit to enforce this.
- **Export:** Audit records can be exported in JSON-Lines format for regulator submission. The export endpoint is accessible to MLRO and Tenant Admin roles only.

---

## Signed URLs

Document files are stored in private Supabase Storage buckets. Access is via signed URLs generated on demand:

- Maximum TTL: **15 minutes**.
- Signed URLs are never cached — a fresh URL is generated per request.
- Cross-tenant signed URL access is blocked by RLS on the `documents` table before a URL is issued.

---

## Secrets Management

| Secret | Where stored | Who can access |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env vars (server-only) + GitHub Actions secrets | Server-side functions only — never `app/` |
| `RESEND_API_KEY` | Vercel env vars (server-only) | Notification module only |
| `UAE_PASS_CLIENT_SECRET` | Vercel env vars (server-only) | UAE Pass OIDC bridge only |
| Database password | Supabase project + GitHub Actions secrets | Migration workflow only |

A CI lint rule fails the build if `lib/supabase/admin.ts` (service-role client) is imported anywhere under `app/`.

---

## Vulnerability Management

- **Dependency scanning:** `npm audit` is run on every CI build. High-severity findings block merge.
- **CodeQL:** GitHub Advanced Security CodeQL analysis is enabled on the repository.
- **Penetration testing:** Scheduled prior to general availability. Results will be summarised on the public security page.

---

## Compliance Certifications

| Standard | Status | Evidence |
|---|---|---|
| SOC 2 Type I | In progress — Drata platform active, Prescient Assurance auditor engaged | Target sign-off ~3 months from Sprint 3 kickoff |
| SOC 2 Type II | Planned — 12-month observation window starts after Type I | — |
| UAE PDPL | Architecture aligned; legal review of DPA in progress | Internal evidence file |
| ADGM DPR / DIFC PDPL | Architecture aligned; legal review in progress | Internal evidence file |
| ISO 27001 | On roadmap for v2 | — |

---

## Sub-Processors

The following sub-processors handle personal data on our behalf. Full details are in the platform's legal sub-processors page (`/legal/sub-processors`).

| Sub-processor | Role | Region |
|---|---|---|
| Supabase | Database, Auth, Storage | GCC-aligned |
| Vercel | Application hosting | Edge / me1 |
| Resend | Transactional email delivery | Global |
| Sumsub | Identity verification (IDV) | Per DPA |
| ComplyAdvantage | Sanctions / PEP / adverse media screening | Per DPA |
| Nomod | Payment processing (billing) | GCC |

---

## Responsible Disclosure

To report a security vulnerability, email **security@truvis.io** with a description of the issue, steps to reproduce, and your contact details. We aim to acknowledge all reports within 48 hours and provide a resolution timeline within 5 business days.

---

*Security Overview v1.0 · 2026-05-07 · TruVis International Services · Review cycle: quarterly*
