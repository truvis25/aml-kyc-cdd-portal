'use client';

import { useState } from 'react';

interface ScreeningHit {
  id: string;
  hit_type: string;
  match_name: string;
  match_score: number | null;
  status: string;
  created_at: string;
}

interface Props {
  initialHits: ScreeningHit[];
  canResolve: boolean;
}

type Resolution = 'confirmed_match' | 'false_positive' | 'escalated';

export function ScreeningHitsPanel({ initialHits, canResolve }: Props) {
  const [hits, setHits] = useState<ScreeningHit[]>(initialHits);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Resolution>('false_positive');
  const [rationale, setRationale] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hits.length === 0) return null;

  const pendingHits = hits.filter((h) => h.status === 'pending');
  const resolvedHits = hits.filter((h) => h.status !== 'pending');

  async function handleResolve(hitId: string) {
    if (rationale.trim().length < 10) {
      setError('Rationale must be at least 10 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/screening/hits/${hitId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, rationale: rationale.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to resolve hit');
      }
      setHits((prev) =>
        prev.map((h) => (h.id === hitId ? { ...h, status: resolution } : h))
      );
      setResolving(null);
      setRationale('');
      setResolution('false_positive');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error resolving hit');
    } finally {
      setSubmitting(false);
    }
  }

  function openResolve(hitId: string) {
    setResolving(hitId);
    setRationale('');
    setResolution('false_positive');
    setError(null);
  }

  function cancelResolve() {
    setResolving(null);
    setRationale('');
    setError(null);
  }

  const statusColor = (s: string) => {
    if (s === 'confirmed_match') return 'bg-red-50 text-red-700';
    if (s === 'false_positive') return 'bg-green-50 text-green-700';
    if (s === 'escalated') return 'bg-orange-50 text-orange-700';
    return 'bg-yellow-50 text-yellow-700';
  };

  // Distinct visual per hit type so analysts can scan a long list and
  // immediately see which kind of hit they're looking at. Adverse media
  // (default-on per FINAL_LAUNCH_PLAN §11.8) is amber to differentiate
  // from the harder-edged sanctions-red and PEP-purple.
  const hitTypeColor = (t: string) => {
    if (t === 'sanction') return 'border-red-200 bg-red-50 text-red-700';
    if (t === 'pep') return 'border-purple-200 bg-purple-50 text-purple-700';
    if (t === 'adverse_media') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-gray-200 bg-gray-50 text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">
        Screening Hits
        {pendingHits.length > 0 && (
          <span className="ml-2 inline-flex items-center rounded-full bg-yellow-50 border border-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-700">
            {pendingHits.length} pending
          </span>
        )}
      </h2>

      <ul className="space-y-3">
        {hits.map((hit) => (
          <li key={hit.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{hit.match_name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${hitTypeColor(hit.hit_type)}`}
                  >
                    {hit.hit_type.replace(/_/g, ' ')}
                  </span>
                  {hit.match_score != null && (
                    <span className="text-xs text-gray-400">score {hit.match_score}</span>
                  )}
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor(hit.status)}`}>
                {hit.status.replace(/_/g, ' ')}
              </span>
            </div>

            {canResolve && hit.status === 'pending' && resolving !== hit.id && (
              <button
                onClick={() => openResolve(hit.id)}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Resolve
              </button>
            )}

            {canResolve && resolving === hit.id && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  {(['false_positive', 'confirmed_match', 'escalated'] as Resolution[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setResolution(r)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                        resolution === r
                          ? r === 'confirmed_match'
                            ? 'bg-red-600 text-white border-red-600'
                            : r === 'false_positive'
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {r === 'confirmed_match' ? 'True Match' : r === 'false_positive' ? 'False Positive' : 'Escalate'}
                    </button>
                  ))}
                </div>
                <textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Rationale (min 10 characters)"
                  rows={2}
                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolve(hit.id)}
                    disabled={submitting}
                    className="rounded px-3 py-1 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving…' : 'Confirm'}
                  </button>
                  <button
                    onClick={cancelResolve}
                    disabled={submitting}
                    className="rounded px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {resolvedHits.length > 0 && pendingHits.length > 0 && (
        <p className="mt-2 text-xs text-gray-400">{resolvedHits.length} resolved</p>
      )}
    </div>
  );
}
