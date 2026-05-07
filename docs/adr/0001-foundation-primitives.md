# ADR-0001: Foundation Primitives

**Status:** Accepted  
**Date:** 2026-05-01  
**Format:** Nygard

---

## Context

Every module built with the TRUVIS DevOs Team workflow depends on a small set of
cross-cutting concerns: audit logging, idempotent notifications, input validation,
and a privacy gate for API responses. Without a shared implementation, each module
authors its own version, leading to inconsistency and audit gaps.

The `check-foundations.ts` Phase-0 gate needs a stable list of files to verify.
These files must exist before any builder starts work.

## Decision

We ship four foundation primitives as part of this repo:

1. **`lib/audit/log.ts`** — `writeAuditLog` and `withAuditedMutation`. Every
   mutation on a sensitive table wraps in `withAuditedMutation` so the audit
   write and the business mutation commit or roll back atomically.

2. **`lib/notifications/idempotency.ts`** — `withIdempotency`. Every outbound
   side-effect (email, webhook, job enqueue) is wrapped so retries never double-fire.

3. **`lib/validate/params.ts`** — `isUuid`, `assertUuid`, `isNonEmptyString`,
   `parsePositiveInt`. All inbound parameters at API boundaries are validated here
   before any DB call.

4. **`lib/public/constants.ts`** and **`lib/public/example.ts`** — `FORBIDDEN_FIELD_SET`
   and the `toPublic<Model>` template. Every API response is filtered through
   `FORBIDDEN_FIELD_SET` before reaching the client.

These files are the minimum viable safety layer. Removing any of them leaves the
project with audit gaps, potential double-fire, unvalidated inputs, or PII leakage.

## Consequences

- **Positive**: Consistent audit trails. No double-fire on retries. Validated
  inputs at all boundaries. No forbidden fields in API responses.
- **Positive**: `check-foundations.ts` can verify the primitives exist before
  any builder dispatches.
- **Negative**: Downstream projects must implement the Prisma models (`AuditLog`,
  `IdempotencyKey`) referenced by these primitives. The primitives fail at runtime
  if the models are absent.
- **Mitigation**: `check-foundations.ts` verifies the presence of the lib files;
  `check-env-readiness.ts` warns on placeholder credentials that would prevent
  runtime verification.
