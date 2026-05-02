'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { RulePack } from '@/modules/admin-config/rule-packs/catalog';

interface Props {
  packs: readonly RulePack[];
  /** workflow_definitions.id values the tenant has already cloned (ignoring version). */
  alreadyClonedPackIds: string[];
  canClone: boolean;
}

/**
 * Catalog of platform-level rule packs (DFSA, FSRA, CBUAE, DNFBP, …) that
 * a tenant admin can clone into a tenant-scoped workflow with one click.
 *
 * Each clone:
 *   - Creates a new workflow_definitions row with tenant_id = current tenant
 *   - Always lands as is_active=false; tenant must then trigger MLRO ack
 *     and activate from the existing Workflows table below this catalog
 *   - Stamps `metadata.cloned_from` on the definition for audit traceability
 */
export function RulePackCatalog({ packs, alreadyClonedPackIds, canClone }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
      {packs.map((pack) => (
        <RulePackCard
          key={pack.id}
          pack={pack}
          alreadyCloned={alreadyClonedPackIds.includes(pack.id)}
          canClone={canClone}
        />
      ))}
    </div>
  );
}

function RulePackCard({
  pack,
  alreadyCloned,
  canClone,
}: {
  pack: RulePack;
  alreadyCloned: boolean;
  canClone: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function clone() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await fetch('/api/admin/workflows/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_workflow_id: pack.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Clone failed (${res.status}).`);
        return;
      }
      const data = await res.json();
      setSuccess(`Cloned as v${data.workflow.version}. Pending MLRO acknowledgement.`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-700">
              {pack.regulator}
            </span>
            <span className="text-[11px] text-gray-400">{pack.jurisdiction}</span>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-gray-900">{pack.display_name}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{pack.tagline}</p>
        </div>
        <span className="shrink-0 text-[11px] text-gray-400">{pack.regulator_full_name}</span>
      </div>

      <ul className="mt-4 space-y-1.5 text-xs text-gray-700">
        {pack.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <div className="text-[11px] text-gray-500">
          Retention floor: <span className="font-semibold text-gray-700">{pack.retention_min_years}y</span>
          <span className="mx-2 text-gray-300">·</span>
          SDD: <span className={pack.sdd_permitted ? 'text-gray-700' : 'text-red-600 font-semibold'}>
            {pack.sdd_permitted ? 'permitted' : 'not permitted'}
          </span>
        </div>
        {canClone ? (
          alreadyCloned ? (
            <span className="text-[11px] text-gray-500">Already cloned · re-clone for a new version</span>
          ) : null
        ) : null}
        {canClone && (
          <button
            type="button"
            onClick={clone}
            disabled={pending}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {pending ? 'Cloning…' : alreadyCloned ? 'Re-clone (+1 version)' : 'Clone to my tenant'}
          </button>
        )}
      </div>

      {error ? (
        <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {success}
        </div>
      ) : null}
    </div>
  );
}
