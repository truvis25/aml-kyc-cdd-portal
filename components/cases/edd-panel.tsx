'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { EddRecord } from '@/modules/edd/edd.types';

const PAYMENT_METHOD_OPTIONS: Array<EddPaymentMethod> = [
  'wire',
  'card',
  'cash',
  'crypto',
  'cheque',
  'standing_order',
  'other',
];

type EddPaymentMethod =
  | 'wire'
  | 'card'
  | 'cash'
  | 'crypto'
  | 'cheque'
  | 'standing_order'
  | 'other';

interface Props {
  customerId: string;
  latestRecord: EddRecord | null;
  canCapture: boolean;
}

/**
 * Reviewer-facing EDD section on the case detail page.
 * - Visible only when the parent page has confirmed the role holds
 *   `customers:read_edd_data` (mlro / senior_reviewer / tenant_admin).
 * - Displays the latest EDD record + supporting documents.
 * - Lets eligible reviewers capture a new version (append-only).
 */
export function EddPanel({ customerId, latestRecord, canCapture }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Enhanced Due Diligence</h2>
        {latestRecord ? (
          <span className="text-xs text-gray-400 tabular-nums">v{latestRecord.version}</span>
        ) : null}
      </div>

      {latestRecord ? (
        <EddDisplay record={latestRecord} />
      ) : (
        <p className="mt-3 text-xs text-gray-500">
          No EDD record captured yet. EDD is required for cases routed to the high-risk or
          unacceptable-risk queues per PRD §M-06.
        </p>
      )}

      {canCapture ? (
        <div className="mt-4 border-t border-gray-100 pt-3">
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              {latestRecord ? 'Capture new version' : 'Capture EDD data'}
            </button>
          ) : (
            <EddCaptureForm
              customerId={customerId}
              initial={latestRecord}
              onCancel={() => setShowForm(false)}
              onSubmitted={() => {
                setShowForm(false);
                router.refresh();
              }}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function EddDisplay({ record }: { record: EddRecord }) {
  return (
    <dl className="mt-3 space-y-3 text-xs">
      <Row label="Source of wealth">{record.source_of_wealth_narrative}</Row>
      <Row label="Source of funds">{record.source_of_funds_narrative}</Row>
      {record.expected_annual_volume_aed != null ? (
        <Row label="Expected annual volume">
          AED {record.expected_annual_volume_aed.toLocaleString()}
        </Row>
      ) : null}
      {record.expected_currencies.length > 0 ? (
        <Row label="Expected currencies">{record.expected_currencies.join(', ')}</Row>
      ) : null}
      {record.expected_payment_methods.length > 0 ? (
        <Row label="Expected payment methods">
          {record.expected_payment_methods.join(', ').replace(/_/g, ' ')}
        </Row>
      ) : null}
      {record.expected_counterparties ? (
        <Row label="Expected counterparties">{record.expected_counterparties}</Row>
      ) : null}
      {record.pep_relationship_details ? (
        <Row label="PEP relationship">{record.pep_relationship_details}</Row>
      ) : null}
      {record.reviewer_rationale ? (
        <Row label="Reviewer rationale">{record.reviewer_rationale}</Row>
      ) : null}
      {record.supporting_document_ids.length > 0 ? (
        <Row label="Supporting documents">
          {record.supporting_document_ids.length} file(s) attached
        </Row>
      ) : null}
      <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-400">
        Submitted {new Date(record.submitted_at).toLocaleString()}
      </div>
    </dl>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-gray-400">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-gray-900">{children}</dd>
    </div>
  );
}

function EddCaptureForm({
  customerId,
  initial,
  onCancel,
  onSubmitted,
}: {
  customerId: string;
  initial: EddRecord | null;
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sow, setSow] = useState(initial?.source_of_wealth_narrative ?? '');
  const [sof, setSof] = useState(initial?.source_of_funds_narrative ?? '');
  const [volume, setVolume] = useState<string>(
    initial?.expected_annual_volume_aed != null ? String(initial.expected_annual_volume_aed) : '',
  );
  const [currencies, setCurrencies] = useState(initial?.expected_currencies.join(', ') ?? '');
  const [counterparties, setCounterparties] = useState(initial?.expected_counterparties ?? '');
  const [methods, setMethods] = useState<EddPaymentMethod[]>(
    (initial?.expected_payment_methods ?? []) as EddPaymentMethod[],
  );
  const [pepDetails, setPepDetails] = useState(initial?.pep_relationship_details ?? '');
  const [rationale, setRationale] = useState(initial?.reviewer_rationale ?? '');

  function toggleMethod(m: EddPaymentMethod) {
    setMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const body = {
        source_of_wealth_narrative: sow.trim(),
        source_of_funds_narrative: sof.trim(),
        expected_annual_volume_aed: volume.trim() === '' ? null : Number(volume),
        expected_currencies: currencies
          .split(',')
          .map((c) => c.trim().toUpperCase())
          .filter((c) => c.length > 0),
        expected_counterparties: counterparties.trim() || null,
        expected_payment_methods: methods,
        pep_relationship_details: pepDetails.trim() || null,
        supporting_document_ids: initial?.supporting_document_ids ?? [],
        reviewer_rationale: rationale.trim() || null,
      };
      const res = await fetch(`/api/edd/${customerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Submission failed (${res.status}).`);
        return;
      }
      onSubmitted();
    });
  }

  return (
    <div className="space-y-3 text-xs">
      <Field label="Source of wealth (required)">
        <textarea
          value={sow}
          onChange={(e) => setSow(e.target.value)}
          rows={3}
          className="block w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
          required
        />
      </Field>
      <Field label="Source of funds (required)">
        <textarea
          value={sof}
          onChange={(e) => setSof(e.target.value)}
          rows={3}
          className="block w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
          required
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Expected annual volume (AED)">
          <input
            type="number"
            min={0}
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="block w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
          />
        </Field>
        <Field label="Expected currencies (comma-separated ISO 4217)">
          <input
            type="text"
            value={currencies}
            onChange={(e) => setCurrencies(e.target.value)}
            placeholder="AED, USD, EUR"
            className="block w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
          />
        </Field>
      </div>
      <Field label="Expected payment methods">
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHOD_OPTIONS.map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-full border px-2.5 py-0.5 capitalize ${
                methods.includes(m)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={methods.includes(m)}
                onChange={() => toggleMethod(m)}
              />
              {m.replace(/_/g, ' ')}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Expected counterparties">
        <textarea
          value={counterparties}
          onChange={(e) => setCounterparties(e.target.value)}
          rows={2}
          className="block w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
        />
      </Field>
      <Field label="PEP relationship details">
        <textarea
          value={pepDetails}
          onChange={(e) => setPepDetails(e.target.value)}
          rows={3}
          className="block w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
          placeholder="Required if customer is a PEP. Title, jurisdiction, time in office, family/associate connections…"
        />
      </Field>
      <Field label="Reviewer rationale">
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={3}
          className="block w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
          placeholder="Why is the EDD package satisfactory (or not)?"
        />
      </Field>
      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div>
      ) : null}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={submit}
          disabled={pending || sow.trim().length < 10 || sof.trim().length < 10}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {pending ? 'Submitting…' : 'Submit EDD record'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-gray-500">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}
