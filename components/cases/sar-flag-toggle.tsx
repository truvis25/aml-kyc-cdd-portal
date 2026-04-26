'use client';

import { useState } from 'react';

interface Props {
  caseId: string;
  initialFlagged: boolean;
}

export function SarFlagToggle({ caseId, initialFlagged }: Props) {
  const [flagged, setFlagged] = useState(initialFlagged);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/sar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sar_flagged: !flagged }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update SAR flag');
      }
      setFlagged((f) => !f);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error updating SAR flag');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {flagged && (
        <span className="text-xs font-medium rounded-full px-3 py-1 bg-red-100 border border-red-300 text-red-800">
          SAR Flagged
        </span>
      )}
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-xs font-medium rounded-full px-3 py-1 border transition-colors disabled:opacity-50 ${
          flagged
            ? 'bg-white border-red-300 text-red-700 hover:bg-red-50'
            : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-700 hover:bg-red-50'
        }`}
      >
        {loading ? '…' : flagged ? 'Remove SAR Flag' : 'Flag for SAR'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
