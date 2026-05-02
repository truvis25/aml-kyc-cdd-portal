-- Migration: 0040_seed_regulator_rule_packs.sql
-- Purpose: Seed platform-level workflow templates ("rule packs") tuned to UAE
--          regulator requirements. Tenants clone these to bootstrap a
--          regulator-aligned onboarding workflow rather than starting from
--          the generic platform default.
--
-- Source: PRD v1.0 §8.3 (Industry Template Library) + §9.3 (Jurisdiction-
--         specific design notes) + FINAL_LAUNCH_PLAN §2.8.
--
-- Scope (v1): 4 packs × individual-KYC only.
--   - DFSA      Dubai Financial Services Authority (DIFC)
--   - FSRA      Financial Services Regulatory Authority (ADGM)
--   - CBUAE     Central Bank of UAE — mainland federal-licensed entities
--   - DNFBP     Designated Non-Financial Business or Profession (CSPs,
--               real estate, gold dealers, law firms)
--
-- Corporate KYB variants are deferred until KYB-specific pack work lands.
--
-- Each row:
--   - tenant_id = NULL  → platform default, visible to all tenants
--   - is_active = false → never auto-activated; the tenant must clone +
--                          activate after MLRO acknowledgement
--   - definition.metadata captures the regulator name, jurisdiction,
--     retention floor, and a short policy summary so the catalog UI can
--     render without re-parsing the steps.

INSERT INTO workflow_definitions (id, tenant_id, name, customer_type, version, definition, is_active)
VALUES
  -- DFSA (DIFC) ------------------------------------------------------------
  (
    'b0000000-0000-0000-0000-000000000001',
    NULL,
    'dfsa-individual-kyc-v1',
    'individual',
    1,
    $${
      "id": "dfsa-individual-kyc-v1",
      "version": 1,
      "customer_type": "individual",
      "metadata": {
        "regulator": "DFSA",
        "regulator_full_name": "Dubai Financial Services Authority",
        "jurisdiction": "DIFC",
        "retention_min_years": 5,
        "sdd_permitted": false,
        "summary": "DFSA-licensed firms in DIFC. Stricter EDD triggers, no Simplified CDD, English-law declarations."
      },
      "steps": [
        {
          "id": "consent",
          "title": "Consent & DIFC Disclosures",
          "type": "consent",
          "required": true,
          "fields": [
            "data_processing", "aml_screening", "identity_verification",
            "third_party_sharing", "difc_pdpl_2020_consent",
            "english_law_jurisdiction"
          ],
          "next": "identity"
        },
        {
          "id": "identity",
          "title": "Personal Information",
          "type": "kyc_form",
          "required": true,
          "fields": [
            "full_name", "date_of_birth", "nationality", "country_of_residence",
            "id_type", "id_number", "id_expiry", "id_issuing_country",
            "emirates_id_number",
            "email", "phone", "address_line1", "city", "postal_code", "country",
            "occupation", "employer",
            "source_of_funds", "purpose_of_relationship",
            "pep_status", "tax_residency"
          ],
          "next": "documents"
        },
        {
          "id": "documents",
          "title": "Identity & Address Documents",
          "type": "document_upload",
          "required": true,
          "document_requirements": [
            {"type": "passport", "label": "Passport", "required": true, "alternatives": []},
            {"type": "national_id", "label": "Emirates ID (UAE residents)", "required": false, "alternatives": []},
            {"type": "proof_of_address", "label": "Proof of Address (≤90 days)", "required": true},
            {"type": "tax_residency_cert", "label": "Tax Residency Certificate (CRS)", "required": true}
          ],
          "next": "complete"
        },
        {
          "id": "complete",
          "title": "Submission Complete",
          "type": "completion",
          "required": false,
          "next": null
        }
      ]
    }$$::JSONB,
    false
  ),

  -- FSRA (ADGM) ------------------------------------------------------------
  (
    'b0000000-0000-0000-0000-000000000002',
    NULL,
    'fsra-individual-kyc-v1',
    'individual',
    1,
    $${
      "id": "fsra-individual-kyc-v1",
      "version": 1,
      "customer_type": "individual",
      "metadata": {
        "regulator": "FSRA",
        "regulator_full_name": "Financial Services Regulatory Authority (ADGM)",
        "jurisdiction": "ADGM",
        "retention_min_years": 6,
        "sdd_permitted": false,
        "summary": "FSRA-regulated firms in ADGM. ADGM DPR 2021 consent, English-law jurisdiction, ADGM-specific entity-type metadata for downstream KYB."
      },
      "steps": [
        {
          "id": "consent",
          "title": "Consent & ADGM Disclosures",
          "type": "consent",
          "required": true,
          "fields": [
            "data_processing", "aml_screening", "identity_verification",
            "third_party_sharing", "adgm_dpr_2021_consent",
            "english_law_jurisdiction"
          ],
          "next": "identity"
        },
        {
          "id": "identity",
          "title": "Personal Information",
          "type": "kyc_form",
          "required": true,
          "fields": [
            "full_name", "date_of_birth", "nationality", "country_of_residence",
            "id_type", "id_number", "id_expiry", "id_issuing_country",
            "emirates_id_number",
            "email", "phone", "address_line1", "city", "postal_code", "country",
            "occupation", "employer",
            "source_of_funds", "purpose_of_relationship",
            "pep_status", "tax_residency"
          ],
          "next": "documents"
        },
        {
          "id": "documents",
          "title": "Identity & Address Documents",
          "type": "document_upload",
          "required": true,
          "document_requirements": [
            {"type": "passport", "label": "Passport", "required": true, "alternatives": []},
            {"type": "national_id", "label": "Emirates ID (UAE residents)", "required": false, "alternatives": []},
            {"type": "proof_of_address", "label": "Proof of Address (≤90 days)", "required": true}
          ],
          "next": "complete"
        },
        {
          "id": "complete",
          "title": "Submission Complete",
          "type": "completion",
          "required": false,
          "next": null
        }
      ]
    }$$::JSONB,
    false
  ),

  -- CBUAE (mainland) -------------------------------------------------------
  (
    'b0000000-0000-0000-0000-000000000003',
    NULL,
    'cbuae-mainland-individual-kyc-v1',
    'individual',
    1,
    $${
      "id": "cbuae-mainland-individual-kyc-v1",
      "version": 1,
      "customer_type": "individual",
      "metadata": {
        "regulator": "CBUAE",
        "regulator_full_name": "Central Bank of the UAE",
        "jurisdiction": "UAE Federal",
        "retention_min_years": 5,
        "sdd_permitted": false,
        "summary": "Federal-licensed financial institutions on UAE mainland. UAE Federal Decree-Law No. 20 of 2019 baseline; goAML integration; 5-year retention."
      },
      "steps": [
        {
          "id": "consent",
          "title": "Consent & UAE PDPL Disclosures",
          "type": "consent",
          "required": true,
          "fields": [
            "data_processing", "aml_screening", "identity_verification",
            "third_party_sharing", "uae_pdpl_2021_consent",
            "goaml_str_disclosure"
          ],
          "next": "identity"
        },
        {
          "id": "identity",
          "title": "Personal Information",
          "type": "kyc_form",
          "required": true,
          "fields": [
            "full_name", "date_of_birth", "nationality", "country_of_residence",
            "id_type", "id_number", "id_expiry", "id_issuing_country",
            "emirates_id_number",
            "email", "phone", "address_line1", "city", "postal_code", "country",
            "occupation", "employer",
            "source_of_funds", "purpose_of_relationship",
            "pep_status"
          ],
          "next": "documents"
        },
        {
          "id": "documents",
          "title": "Identity & Address Documents",
          "type": "document_upload",
          "required": true,
          "document_requirements": [
            {"type": "passport", "label": "Passport or Emirates ID", "required": true, "alternatives": ["national_id"]},
            {"type": "national_id", "label": "Emirates ID (UAE residents)", "required": false, "alternatives": []},
            {"type": "proof_of_address", "label": "Proof of Address (≤90 days)", "required": true}
          ],
          "next": "complete"
        },
        {
          "id": "complete",
          "title": "Submission Complete",
          "type": "completion",
          "required": false,
          "next": null
        }
      ]
    }$$::JSONB,
    false
  ),

  -- DNFBP -----------------------------------------------------------------
  (
    'b0000000-0000-0000-0000-000000000004',
    NULL,
    'dnfbp-individual-kyc-v1',
    'individual',
    1,
    $${
      "id": "dnfbp-individual-kyc-v1",
      "version": 1,
      "customer_type": "individual",
      "metadata": {
        "regulator": "MOE",
        "regulator_full_name": "UAE Ministry of Economy (DNFBP supervisor)",
        "jurisdiction": "UAE Federal — DNFBP",
        "retention_min_years": 5,
        "sdd_permitted": false,
        "summary": "Designated Non-Financial Business or Professions (CSPs, real estate, gold dealers, law firms). Mandatory MLRO field, goAML registration disclosure, sector classification."
      },
      "steps": [
        {
          "id": "consent",
          "title": "Consent & DNFBP Disclosures",
          "type": "consent",
          "required": true,
          "fields": [
            "data_processing", "aml_screening", "identity_verification",
            "third_party_sharing", "uae_pdpl_2021_consent",
            "dnfbp_aml_policy_acknowledgement"
          ],
          "next": "identity"
        },
        {
          "id": "identity",
          "title": "Personal Information",
          "type": "kyc_form",
          "required": true,
          "fields": [
            "full_name", "date_of_birth", "nationality", "country_of_residence",
            "id_type", "id_number", "id_expiry", "id_issuing_country",
            "emirates_id_number",
            "email", "phone", "address_line1", "city", "postal_code", "country",
            "occupation", "employer",
            "source_of_funds", "purpose_of_relationship",
            "pep_status"
          ],
          "next": "documents"
        },
        {
          "id": "documents",
          "title": "Identity & Address Documents",
          "type": "document_upload",
          "required": true,
          "document_requirements": [
            {"type": "passport", "label": "Passport", "required": true, "alternatives": []},
            {"type": "national_id", "label": "Emirates ID (UAE residents)", "required": false, "alternatives": []},
            {"type": "proof_of_address", "label": "Proof of Address (≤90 days)", "required": true}
          ],
          "next": "complete"
        },
        {
          "id": "complete",
          "title": "Submission Complete",
          "type": "completion",
          "required": false,
          "next": null
        }
      ]
    }$$::JSONB,
    false
  )
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE workflow_definitions IS
  'Versioned onboarding workflow definitions. tenant_id=NULL rows are platform-level templates (rule packs) that tenants clone. tenant_id=<UUID> rows are tenant-customised clones.';
