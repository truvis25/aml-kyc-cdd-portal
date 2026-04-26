'use client';

import { useState } from 'react';
import Link from 'next/link';

interface DocumentRow {
  id: string;
  document_type: string;
  file_name: string;
  status: string;
  uploaded_at: string;
}

interface Props {
  documents: DocumentRow[];
  canVerify: boolean;
}

type DocStatus = 'pending' | 'verified' | 'rejected';

export function DocumentVerifyPanel({ documents: initialDocs, canVerify }: Props) {
  const [docs, setDocs] = useState<DocumentRow[]>(initialDocs);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (docs.length === 0) return null;

  async function updateDocStatus(docId: string, status: DocStatus, reason?: string) {
    setLoading(docId);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${docId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update document');
      }
      setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, status } : d)));
      setRejectingId(null);
      setRejectReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error updating document');
    } finally {
      setLoading(null);
    }
  }

  function handleVerify(docId: string) {
    updateDocStatus(docId, 'verified');
  }

  function handleRejectConfirm(docId: string) {
    updateDocStatus(docId, 'rejected', rejectReason.trim() || undefined);
  }

  const statusClass = (s: string) => {
    if (s === 'verified') return 'bg-green-50 text-green-700';
    if (s === 'rejected') return 'bg-red-50 text-red-700';
    return 'bg-gray-50 text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Documents</h2>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <ul className="space-y-3">
        {docs.map((doc) => {
          const isPending = doc.status !== 'verified' && doc.status !== 'rejected';
          const isRejecting = rejectingId === doc.id;

          return (
            <li key={doc.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-700 capitalize">
                  {doc.document_type.replace(/_/g, ' ')}
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(doc.status)}`}>
                  {doc.status}
                </span>
              </div>
              <Link
                href={`/api/documents/${doc.id}/download`}
                className="mt-0.5 text-xs text-blue-600 hover:underline truncate block"
                target="_blank"
              >
                {doc.file_name}
              </Link>

              {canVerify && isPending && !isRejecting && (
                <div className="mt-1.5 flex gap-2">
                  <button
                    onClick={() => handleVerify(doc.id)}
                    disabled={loading === doc.id}
                    className="rounded px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50"
                  >
                    {loading === doc.id ? '…' : 'Verify'}
                  </button>
                  <button
                    onClick={() => { setRejectingId(doc.id); setRejectReason(''); setError(null); }}
                    disabled={loading === doc.id}
                    className="rounded px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}

              {canVerify && isRejecting && (
                <div className="mt-2 space-y-1.5">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Rejection reason (optional)"
                    className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectConfirm(doc.id)}
                      disabled={loading === doc.id}
                      className="rounded px-2 py-0.5 text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading === doc.id ? 'Saving…' : 'Confirm Reject'}
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRejectReason(''); }}
                      className="rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
