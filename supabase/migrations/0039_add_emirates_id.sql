-- Migration: 0039_add_emirates_id.sql
-- Purpose: First-class Emirates ID field on customer identity data.
-- Source: PRD v1.0 §M-02 ("Residency permit / Emirates ID") + FINAL_LAUNCH_PLAN
--         §2.2 (UAE-specific must-have for v1).
--
-- Why first-class instead of leaving it inside id_number:
--   - Routing: a UAE-resident customer must produce an Emirates ID even if
--     their primary id_type is a passport. Storing it on its own column
--     lets us require it conditionally without overloading id_number.
--   - Screening: the EID number is searchable on its own in tenant-side
--     systems (KYB cross-checks against business EID rosters).
--   - Format: 784-YYYY-NNNNNNN-N (15 digits, Luhn-checked); we want a CHECK
--     constraint so the column itself rejects malformed input.
--
-- Storage convention: dashes are stored as-is (canonical 18-char form
-- including the three '-' separators). The application normalizes input
-- to this form before INSERT — see modules/emirates-id/parser.ts.

ALTER TABLE customer_data_versions
  ADD COLUMN IF NOT EXISTS emirates_id_number TEXT
    CHECK (
      emirates_id_number IS NULL
      OR emirates_id_number ~ '^784-[0-9]{4}-[0-9]{7}-[0-9]$'
    );

COMMENT ON COLUMN customer_data_versions.emirates_id_number IS
  'UAE Emirates ID in canonical 784-YYYY-NNNNNNN-N format. Conditionally required when nationality=AE or country_of_residence=AE; enforced at the API layer (Zod) — the CHECK only validates format.';

-- Lookup index for name + EID searches the operator workbench will run later
-- (e.g. "find any customer record with this EID across versions").
CREATE INDEX IF NOT EXISTS customer_data_versions_emirates_id_idx
  ON customer_data_versions (emirates_id_number)
  WHERE emirates_id_number IS NOT NULL;
