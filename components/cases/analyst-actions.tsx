'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AnalystActionsProps {
  caseId: string;
  canApprove: boolean;
  canReject: boolean;
}

export function AnalystActions({ caseId, canApprove, canReject }: AnalystActionsProps) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [rationale, setRationale] = useState('');
  const [action, setAction] = useState<'note' | 'approve' | 'reject' | 'escalate' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitNote() {
    if (!note.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'note', note }),
      });
      if (!res.ok) throw new Error('Failed to add note');
      setNote('');
      setAction(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitDecision(decision: 'approved' | 'rejected') {
    if (rationale.trim().length < 20) {
      setError('Rationale must be at least 20 characters');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/approvals/${caseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, rationale }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to record decision');
      }
      setAction(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setAction(action === 'note' ? null : 'note')}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Add Note
        </button>
        {canApprove && (
          <button
            onClick={() => setAction(action === 'approve' ? null : 'approve')}
            className="rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 shadow-sm hover:bg-green-100"
          >
            Approve
          </button>
        )}
        {canReject && (
          <button
            onClick={() => setAction(action === 'reject' ? null : 'reject')}
            className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm hover:bg-red-100"
          >
            Reject
          </button>
        )}
      </div>

      {action === 'note' && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a case note…"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button onClick={submitNote} disabled={!note.trim() || submitting}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Saving…' : 'Save Note'}
            </button>
            <button onClick={() => setAction(null)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {(action === 'approve' || action === 'reject') && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {action === 'approve' ? 'Approval' : 'Rejection'} Rationale
            <span className="text-red-500 ml-1">*</span>
          </p>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Provide a detailed rationale for this decision (min. 20 characters)…"
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => submitDecision(action as 'approved' | 'rejected')}
              disabled={submitting}
              className={`rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 ${action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {submitting ? 'Recording…' : action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
            <button onClick={() => { setAction(null); setRationale(''); }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}
    </div>
  );
}
