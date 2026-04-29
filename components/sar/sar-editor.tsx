'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SarReport, SarTransaction } from '@/modules/sar/types';
import { REASON_CODES, INSTRUMENT_TYPES } from '@/modules/sar/types';

interface Props {
  report: SarReport;
  locked: boolean;
}

export function SarEditor({ report, locked }: Props) {
  const router = useRouter();
  const [reasonCodes, setReasonCodes] = useState<string[]>(report.reason_codes);
  const [narrative, setNarrative] = useState<string>(report.narrative);
  const [activityStart, setActivityStart] = useState<string>(
    report.activity_start ? report.activity_start.slice(0, 10) : '',
  );
  const [activityEnd, setActivityEnd] = useState<string>(
    report.activity_end ? report.activity_end.slice(0, 10) : '',
  );
  const [transactions, setTransactions] = useState<SarTransaction[]>(
    report.transactions ?? [],
  );

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function toggleReason(code: string) {
    setReasonCodes((codes) =>
      codes.includes(code) ? codes.filter((c) => c !== code) : [...codes, code],
    );
  }

  function addTransaction() {
    setTransactions((txs) => [
      ...txs,
      {
        date: new Date().toISOString(),
        amount_aed: 0,
        instrument_type: 'cash',
        counterparty: '',
        description: '',
      },
    ]);
  }

  function removeTransaction(index: number) {
    setTransactions((txs) => txs.filter((_, i) => i !== index));
  }

  function updateTransaction<K extends keyof SarTransaction>(
    index: number,
    field: K,
    value: SarTransaction[K],
  ) {
    setTransactions((txs) =>
      txs.map((tx, i) => (i === index ? { ...tx, [field]: value } : tx)),
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const body = {
        reason_codes: reasonCodes,
        narrative,
        activity_start: activityStart ? new Date(activityStart).toISOString() : null,
        activity_end: activityEnd ? new Date(activityEnd).toISOString() : null,
        transactions,
      };
      const res = await fetch(`/api/sar/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save SAR draft');
      }
      setSuccess('Draft saved');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function submitSar() {
    if (!confirm('Mark this SAR as submitted to the FIU? You will not be able to edit it after.')) {
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/sar/${report.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to submit SAR');
      }
      setSuccess('SAR marked as submitted');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  const totalAed = transactions.reduce((s, t) => s + Number(t.amount_aed || 0), 0);

  return (
    <div className="space-y-6">
      {locked && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-xs text-purple-800">
          This SAR has been submitted and is locked from further edits. Download the XML for
          your records below.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
          {success}
        </div>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Reason for reporting</h2>
        <p className="text-xs text-gray-500 mb-4">
          Select all goAML reason codes that apply.
        </p>
        <div className="flex flex-wrap gap-2">
          {REASON_CODES.map((code) => {
            const active = reasonCodes.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleReason(code)}
                disabled={locked}
                className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors disabled:opacity-50 ${
                  active
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Activity window</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700">Start date</label>
            <input
              type="date"
              value={activityStart}
              onChange={(e) => setActivityStart(e.target.value)}
              disabled={locked}
              className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">End date</label>
            <input
              type="date"
              value={activityEnd}
              onChange={(e) => setActivityEnd(e.target.value)}
              disabled={locked}
              className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Narrative</h2>
        <p className="text-xs text-gray-500 mb-3">
          A clear factual description: who, what, when, where and why this is suspicious.
          Minimum 20 characters; goAML accepts up to 50,000.
        </p>
        <textarea
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          disabled={locked}
          rows={10}
          className="block w-full rounded-md border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 font-mono"
          placeholder="On DD/MM/YYYY, customer made a transaction of AED X to counterparty Y..."
        />
        <div className="mt-2 text-xs text-gray-500 text-right">
          {narrative.length} / 50,000
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Transactions</h2>
          <span className="text-xs text-gray-500">
            Total: <span className="font-medium text-gray-700">AED {totalAed.toFixed(2)}</span>
          </span>
        </div>
        {transactions.length === 0 && (
          <p className="text-xs text-gray-500 mb-3">
            No transactions added yet. Add the suspicious activity below.
          </p>
        )}
        <div className="space-y-3">
          {transactions.map((tx, idx) => (
            <div
              key={idx}
              className="rounded-md border border-gray-200 bg-gray-50/40 p-3 grid grid-cols-12 gap-2"
            >
              <input
                type="datetime-local"
                value={tx.date.slice(0, 16)}
                onChange={(e) =>
                  updateTransaction(idx, 'date', new Date(e.target.value).toISOString())
                }
                disabled={locked}
                className="col-span-3 rounded border border-gray-200 px-2 py-1.5 text-xs disabled:bg-gray-100"
              />
              <input
                type="number"
                step="0.01"
                value={tx.amount_aed}
                onChange={(e) =>
                  updateTransaction(idx, 'amount_aed', Number(e.target.value))
                }
                disabled={locked}
                className="col-span-2 rounded border border-gray-200 px-2 py-1.5 text-xs text-right disabled:bg-gray-100"
                placeholder="AED"
              />
              <select
                value={tx.instrument_type}
                onChange={(e) =>
                  updateTransaction(
                    idx,
                    'instrument_type',
                    e.target.value as SarTransaction['instrument_type'],
                  )
                }
                disabled={locked}
                className="col-span-2 rounded border border-gray-200 px-2 py-1.5 text-xs disabled:bg-gray-100"
              >
                {INSTRUMENT_TYPES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={tx.counterparty ?? ''}
                onChange={(e) => updateTransaction(idx, 'counterparty', e.target.value)}
                disabled={locked}
                placeholder="Counterparty"
                className="col-span-4 rounded border border-gray-200 px-2 py-1.5 text-xs disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={() => removeTransaction(idx)}
                disabled={locked}
                className="col-span-1 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
              >
                Remove
              </button>
              <input
                type="text"
                value={tx.description ?? ''}
                onChange={(e) => updateTransaction(idx, 'description', e.target.value)}
                disabled={locked}
                placeholder="Description (optional)"
                className="col-span-12 rounded border border-gray-200 px-2 py-1.5 text-xs disabled:bg-gray-100"
              />
            </div>
          ))}
        </div>
        {!locked && (
          <button
            type="button"
            onClick={addTransaction}
            className="mt-3 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded px-2 py-1"
          >
            + Add transaction
          </button>
        )}
      </section>

      <div className="flex items-center gap-3 sticky bottom-4 bg-white/80 backdrop-blur p-3 rounded-lg border border-gray-200 shadow-sm">
        <button
          type="button"
          onClick={save}
          disabled={saving || locked}
          className="text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={submitSar}
          disabled={submitting || locked || report.status === 'draft' && narrative.length < 20}
          className="text-sm font-medium rounded-md bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Mark as submitted to FIU'}
        </button>
        <span className="text-xs text-gray-500 ml-auto">
          Submitting locks edits. Download the XML before submitting.
        </span>
      </div>
    </div>
  );
}
