'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  workflowId: string;
  workflowName: string;
  initialActive: boolean;
  isPlatformLevel: boolean;
}

export function WorkflowToggle({ workflowId, workflowName, initialActive, isPlatformLevel }: Props) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(initialActive);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update workflow');
      }
      setIsActive((v) => !v);
      setConfirming(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error updating workflow');
    } finally {
      setLoading(false);
    }
  }

  if (isPlatformLevel) {
    return (
      <span className="text-xs text-gray-400 italic">Platform-managed</span>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-700">
          {isActive ? 'Deactivate' : 'Activate'} <strong>{workflowName}</strong>?
        </span>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`rounded px-2 py-0.5 text-xs font-medium text-white disabled:opacity-50 ${
            isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? '…' : 'Confirm'}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null); }}
          disabled={loading}
          className="rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={`rounded px-2 py-0.5 text-xs font-medium border transition-colors ${
        isActive
          ? 'bg-white border-red-200 text-red-600 hover:bg-red-50'
          : 'bg-white border-green-200 text-green-600 hover:bg-green-50'
      }`}
    >
      {isActive ? 'Deactivate' : 'Activate'}
    </button>
  );
}
