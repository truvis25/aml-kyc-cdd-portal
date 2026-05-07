# API Reference — AML/KYC/CDD Portal

> Classification: Internal (public version ships with Sprint 3 S3-03)  
> Status: API v1 routes exist in the codebase. Public OpenAPI spec and `/docs/api` page ship in Sprint 3.  
> TruVis International Services

This document is the narrative companion to the future OpenAPI spec that will be auto-generated from Zod schemas and published at `/docs/api`. Use it as the authoritative description of the v1 API surface until the OpenAPI page ships.

---

## Overview

The TruVis AML/KYC/CDD Portal exposes a REST API under `/api/v1` (Sprint 3). Current internal routes live under `/api/` (App Router route handlers). All responses are JSON. All mutating endpoints require a valid session JWT.

**Base URL:** `https://<your-tenant>.truvis.io/api/v1` (Sprint 3; current: `/api/`)

---

## Authentication

All API requests must include a `Authorization: Bearer <jwt>` header (or a valid Supabase session cookie for browser clients).

### Obtaining a JWT

1. POST to Supabase Auth (`/auth/v1/token?grant_type=password`) with `email` and `password`.
2. For elevated roles (`mlro`, `tenant_admin`, `platform_super_admin`): MFA verification is required. The returned JWT will have `mfa_verified: false` until the TOTP challenge is completed.
3. The JWT is enriched at mint time by the `custom_access_token_hook` Postgres function. Claims: `tenant_id`, `role`, `mfa_verified`, `sub` (user UUID).

### Token expiry

JWTs expire per the Supabase project's JWT expiry setting (default: 1 hour). Refresh tokens are long-lived. Browser clients handle refresh automatically via the Supabase JS client.

---

## Versioning

The API follows semantic versioning. Breaking changes introduce a new major version (`/v2`). Additive changes (new fields, new optional query params) are non-breaking and land in the current version. Deprecated endpoints are announced at least 60 days before removal.

---

## Rate Limiting

Rate limiting policy is TBD — to be defined before Sprint 3 public launch. Expect standard per-tenant limits. Responses will include `X-RateLimit-Remaining` and `Retry-After` headers when limits are enforced.

---

## Resource Groups

### Customers (`/v1/customers`)

Manage KYC individuals and KYB entities associated with the authenticated tenant.

| Method | Path | Description | Required role |
|---|---|---|---|
| GET | `/v1/customers` | List customers (paginated) | analyst+ |
| GET | `/v1/customers/:id` | Get customer detail (no PII in logs) | analyst+ |
| POST | `/v1/customers` | Create customer record | onboarding_agent+ |

Customer PII fields (`full_name`, `date_of_birth`, `id_number`, etc.) are never surfaced in application logs. The `FORBIDDEN_FIELD_SET` constant in `lib/public/constants.ts` governs which fields are redacted from API responses to the `read_only` role.

---

### Cases (`/v1/cases`)

Compliance case queue and lifecycle management.

| Method | Path | Description | Required role |
|---|---|---|---|
| GET | `/v1/cases` | List cases (paginated, filtered by status/risk) | analyst+ |
| GET | `/v1/cases/:id` | Get case detail | analyst+ |
| POST | `/v1/cases/:id/events` | Add a case event (note, status change) | analyst+ |
| POST | `/v1/cases/:id/approve` | Approve a case | senior_reviewer+ (risk-gated) |
| POST | `/v1/cases/:id/escalate` | Escalate to next role tier | analyst+ |
| POST | `/v1/cases/:id/sar` | Flag case for SAR | mlro only |
| POST | `/v1/cases/:id/rai` | Issue Request for Additional Information | analyst+ |

Approval is risk-gated: low/medium-risk cases can be approved by `senior_reviewer`; high-risk requires `mlro`. The server enforces this; the UI enforces it redundantly.

---

### Screening (`/v1/screening`)

Sanctions, PEP, and adverse media screening.

| Method | Path | Description | Required role |
|---|---|---|---|
| GET | `/v1/screening/hits/:case_id` | List screening hits for a case | analyst+ |
| POST | `/v1/screening/hits/:hit_id/resolve` | Resolve a hit (true match / false positive) | analyst+ |
| POST | `/v1/screening/run` | Manually trigger a re-screen | analyst+ |

Screening hits are immutable on resolution — `screening_hit_resolutions` is an append-only table. The ComplyAdvantage adapter is the production provider; a mock adapter is used locally.

---

### Documents (`/v1/documents`)

Document management and signed URL access.

| Method | Path | Description | Required role |
|---|---|---|---|
| GET | `/v1/documents/:id/url` | Get a fresh signed URL (max 15 min TTL) | analyst+ |
| POST | `/v1/documents/:id/verify` | Mark a document as verified | analyst+ |
| GET | `/v1/documents/customer/:id` | List documents for a customer | analyst+ |

Documents are stored in private Supabase Storage buckets. Signed URLs are generated per-request and never cached.

---

### Audit (`/v1/audit`)

Append-only audit trail. Read-only for all roles; write is performed internally by `modules/audit/audit.service.ts`.

| Method | Path | Description | Required role |
|---|---|---|---|
| GET | `/v1/audit` | Query audit log (filtered by customer_id / case_id / event_type) | mlro, tenant_admin |
| GET | `/v1/audit/export` | Export audit events as JSON-Lines | mlro, tenant_admin |

The audit log is hash-chained. The export is regulator-ready.

---

### SAR (`/v1/sar`)

SAR Register management.

| Method | Path | Description | Required role |
|---|---|---|---|
| GET | `/v1/sar` | List SAR reports for the tenant | mlro only |
| GET | `/v1/sar/:id` | Get SAR detail | mlro only |
| POST | `/v1/sar/:id/export` | Export goAML XML (XSD-validated) | mlro only |

SAR data is visible only to MLRO. The SAR flag on a case is masked from analyst and senior_reviewer roles (tipping-off protection).

---

## Sandbox

A sandbox tenant with synthetic seed data will be available at `/docs/api` from Sprint 3 (S3-03). Test credentials will be provided to registered developers.

---

## Error Format

All errors return JSON with the following shape:

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to approve this case.",
    "request_id": "req_01abc..."
  }
}
```

Common error codes: `PERMISSION_DENIED`, `NOT_FOUND`, `INVALID_INPUT`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`.

---

*API v1 narrative · 2026-05-07 · TruVis International Services · Internal until /docs/api ships (Sprint 3)*
