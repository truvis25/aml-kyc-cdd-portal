'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
}

export function WorkflowAckButton({ workflowId, workflowName, workflowVersion }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/workflows/${workflowId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to acknowledge');
      }
      setDone(true);
      setConfirming(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error acknowledging');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <span className="text-xs text-green-700">Acknowledged</span>;
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded border border-blue-200 bg-white px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
      >
        Acknowledge as MLRO
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 max-w-xs">
      <p className="text-xs text-gray-700">
        Acknowledge that <strong>{workflowName} v{workflowVersion}</strong> may be activated by Tenant Admin?
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional notes for the audit trail"
        rows={2}
        maxLength={2000}
        className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={loading}
          className="rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '…' : 'Confirm acknowledgement'}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null); }}
          disabled={loading}
          className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
