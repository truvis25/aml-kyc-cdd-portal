'use client';

import { useState } from 'react';
import type { TenantConfig } from '@/modules/admin-config/types';
import { BrandingUploader } from './branding-uploader';

interface Props {
  initial: TenantConfig;
  initialVersion: number;
  canEdit: boolean;
}

const INDIVIDUAL_DOC_TYPES = [
  'passport',
  'national_id',
  'residence_permit',
  'driving_licence',
  'proof_of_address',
  'bank_statement',
  'utility_bill',
] as const;

const CORPORATE_DOC_TYPES = [
  'trade_license',
  'memorandum_of_association',
  'bank_statement',
  'proof_of_address',
] as const;

export function TenantConfigForm({ initial, initialVersion, canEdit }: Props) {
  const [config, setConfig] = useState<TenantConfig>(initial);
  const [version, setVersion] = useState<number>(initialVersion);
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function toggleModule(key: keyof TenantConfig['modules']) {
    setConfig((c) => ({ ...c, modules: { ...c.modules, [key]: !c.modules[key] } }));
  }

  function toggleRequiredDoc(group: 'required_individual' | 'required_corporate', value: string) {
    setConfig((c) => {
      const list = c.documents[group];
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
      return { ...c, documents: { ...c.documents, [group]: next } };
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save configuration');
      }
      const data = (await res.json()) as { tenant_config: { version: number; created_at: string } };
      setVersion(data.tenant_config.version);
      setSavedAt(new Date(data.tenant_config.created_at).toLocaleString());
      setNotes('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg bg-white border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium text-gray-900">Tenant Configuration</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Version {version || '—'}{savedAt ? ` · saved ${savedAt}` : ''} · changes create a new
            version; previous versions are preserved.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Modules */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700">Modules</h3>
          <p className="text-xs text-gray-500 mt-1 mb-3">Toggle which onboarding flows this tenant offers.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(
              [
                ['individual_kyc', 'Individual KYC'],
                ['corporate_kyb', 'Corporate KYB'],
                ['edd_enabled', 'Enhanced Due Diligence'],
                ['ongoing_screening', 'Ongoing screening (Phase 2)'],
              ] as Array<[keyof TenantConfig['modules'], string]>
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={config.modules[key]}
                  disabled={!canEdit || (key === 'ongoing_screening')}
                  onChange={() => toggleModule(key)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{label}</span>
                {key === 'ongoing_screening' && (
                  <span className="text-xs text-gray-400">— not yet available</span>
                )}
              </label>
            ))}
          </div>
        </section>

        {/* Documents */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700">Required documents</h3>
          <p className="text-xs text-gray-500 mt-1 mb-3">Customers will be prompted to upload these document types.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DocumentGroup
              title="Individual KYC"
              types={[...INDIVIDUAL_DOC_TYPES]}
              selected={config.documents.required_individual}
              disabled={!canEdit}
              onToggle={(v) => toggleRequiredDoc('required_individual', v)}
            />
            <DocumentGroup
              title="Corporate KYB"
              types={[...CORPORATE_DOC_TYPES]}
              selected={config.documents.required_corporate}
              disabled={!canEdit}
              onToggle={(v) => toggleRequiredDoc('required_corporate', v)}
            />
          </div>
        </section>

        {/* Risk thresholds (read-only) */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700">Risk thresholds</h3>
          <p className="text-xs text-gray-500 mt-1 mb-3">
            Read-only in MVP. Score ranges drive case routing per
            <code className="mx-1 font-mono text-[11px] bg-gray-100 px-1 rounded">
              ROLES_DASHBOARDS_FLOWS.md §4
            </code>.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ReadOnlyStat label="Low ≤" value={config.risk_thresholds.medium} />
            <ReadOnlyStat label="Medium ≤" value={config.risk_thresholds.high} />
            <ReadOnlyStat label="High ≤" value={config.risk_thresholds.unacceptable} />
            <ReadOnlyStat label="Unacceptable >" value={config.risk_thresholds.unacceptable} />
          </div>
        </section>

        {/* Branding */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700">Branding</h3>
          <p className="text-xs text-gray-500 mt-1 mb-3">
            Logo and display name appear on the customer-facing onboarding pages. Logo
            upload writes a new tenant_config version automatically; the display name
            below is staged until you Save.
          </p>
          <BrandingUploader initialLogoUrl={config.branding.logo_url} canEdit={canEdit} />
          <input
            type="text"
            value={config.branding.company_name ?? ''}
            disabled={!canEdit}
            placeholder="Display name (defaults to tenant name)"
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                branding: { ...c.branding, company_name: e.target.value || null },
              }))
            }
            className="mt-3 w-full max-w-md rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </section>

        {/* Save controls */}
        {canEdit && (
          <section className="pt-4 border-t border-gray-100 space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional) — explain what this change is for"
              maxLength={2000}
              rows={2}
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="rounded px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save new version'}
              </button>
              <p className="text-xs text-gray-400">A new tenant_config row is appended; older versions are preserved.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function DocumentGroup({
  title,
  types,
  selected,
  disabled,
  onToggle,
}: {
  title: string;
  types: string[];
  selected: string[];
  disabled: boolean;
  onToggle: (v: string) => void;
}) {
  return (
    <div className="rounded border border-gray-200 p-3">
      <p className="text-xs font-medium text-gray-700 mb-2">{title}</p>
      <div className="space-y-1">
        {types.map((t) => (
          <label key={t} className="flex items-center gap-2 text-sm text-gray-700 capitalize">
            <input
              type="checkbox"
              checked={selected.includes(t)}
              disabled={disabled}
              onChange={() => onToggle(t)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{t.replace(/_/g, ' ')}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ReadOnlyStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-gray-200 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
