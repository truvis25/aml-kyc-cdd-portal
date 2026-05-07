# Pricing — AML/KYC/CDD Portal

> Internal source of truth for tier definitions, metering rules, overage math, and `tenant_billing` column mapping.  
> Canonical until `docs/PRICING.md` is superseded by a finance system record.  
> Classification: Internal · Confidential · TruVis International Services

---

## Tier Definitions

| Tier | Base / month (AED) | Included verifications | Overage per verification (AED) | Seat limit | Notes |
|---|---|---|---|---|---|
| Starter | 1,500 | 100 | 15.00 | 3 | Self-serve trial converts here; suitable for DNFBPs and small brokers |
| Growth | 4,500 | 500 | 12.00 | 10 | Default for fintechs and mid-size regulated entities |
| Scale | 12,000 | 2,000 | 9.00 | Unlimited | Regulated financial institutions, multi-branch operations |
| Enterprise | Custom | Custom | Custom | Custom | Banks, multi-jurisdiction, custom SLA; "Request quote" CTA on pricing page |

All prices are in **UAE Dirhams (AED)**, exclusive of VAT (5% UAE VAT applies).

---

## What Counts as a Verification

A "verification" is one of:

- One **completed Individual KYC** — the `onboarding_sessions` row reaches `status = 'completed'` for an individual customer.
- One **completed Corporate KYB** — the `onboarding_sessions` row reaches `status = 'completed'` for a corporate entity.

The following do **not** count as billable verifications:

- Abandoned sessions (`status = 'abandoned'` or `status = 'expired'`)
- Sessions that fail consent capture
- Re-onboarding a previously-completed customer (treated as a new session — metered separately)
- MLRO-initiated manual EDD reviews (not a new onboarding session)

---

## Ongoing Monitoring — Bundled (Not Metered)

Monthly re-screens of approved customers (pg_cron schedule, Sprint 2 S2-05) are **bundled into the subscription** on all paid tiers. They are not counted as billable verifications. This ensures predictable cost for tenants with large approved-customer bases.

Adverse media hits resulting from re-screens are also not separately metered.

---

## Trial Tier

- Duration: **14 days** from tenant creation.
- Limits: Starter tier limits apply (100 verifications, 3 seats).
- Conversion: Tenant Admin upgrades from `/admin/billing` via Nomod payment.
- Expired trials: Platform access is read-only; onboarding blocked; MLRO and Analysts retain access to existing cases.

---

## Overage Calculation

Overage is charged per verification above the included bundle:

```
Monthly invoice = base_price + max(0, verifications_used - included_verifications) × overage_rate
```

Example (Growth tier, 620 verifications in a month):

```
Invoice = 4,500 + (620 - 500) × 12.00
        = 4,500 + 1,440
        = AED 5,940
```

---

## `tenant_billing` Table Column Mapping

The `tenant_billing` table tracks per-tenant billing state. Column → meaning:

| Column | Type | Meaning |
|---|---|---|
| `tenant_id` | UUID | Foreign key to `tenants.id` |
| `billing_tier` | text | `starter`, `growth`, `scale`, `enterprise`, `trial` |
| `base_price_aed` | numeric | Monthly base price in AED (0 for trial) |
| `included_verifications` | integer | Verifications included in the base price |
| `overage_rate_aed` | numeric | AED per verification above the bundle |
| `seat_limit` | integer | Max active users; NULL = unlimited |
| `trial_ends_at` | timestamptz | NULL for non-trial tiers |
| `current_period_start` | timestamptz | Start of the current billing period |
| `current_period_end` | timestamptz | End of the current billing period |
| `verifications_used` | integer | Rolling count for the current period |
| `nomod_subscription_id` | text | Nomod subscription reference (Sprint 3) |
| `status` | text | `trialing`, `active`, `past_due`, `cancelled` |

---

## Nomod Integration

Live billing via Nomod ships in Sprint 3 (S3-13). Until then:

- `tenant_billing` rows are seeded manually by platform admins.
- Overage tracking (`verifications_used`) is incremented by a trigger on `onboarding_sessions` when `status` transitions to `completed`.
- Invoice surface at `/admin/billing` is a placeholder UI until Nomod is wired.

---

## Seat Enforcement

Seat limits are enforced at user invitation time: if `active_users_count >= seat_limit`, the invitation API returns `SEAT_LIMIT_REACHED`. Enterprise and Scale tenants with `seat_limit = NULL` are not seat-gated.

---

*Pricing v1.0 · 2026-05-07 · TruVis International Services · Review with Finance before public launch*
