'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  caseId: string;
}

export function CreateSarFromCaseButton({ caseId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createDraft() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          reason_codes: ['UNK'],
          narrative:
            'Draft created. Please complete the narrative with: who, what, when, where, and why this activity is suspicious.',
          transactions: [],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to create SAR draft');
      }
      const data = (await res.json()) as { report: { id: string } };
      router.push(`/sar/${data.report.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="button"
        onClick={createDraft}
        disabled={loading}
        className="text-xs font-medium rounded-md border border-amber-300 bg-white px-3 py-1.5 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
      >
        {loading ? 'Creating…' : 'Draft SAR'}
      </button>
    </div>
  );
}
