import { GitBranch } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/modules/auth/rbac';
import { Role } from '@/lib/constants/roles';
import { getPageAuth } from '@/lib/auth/page-auth';
import { WorkflowToggle } from '@/components/admin/workflow-toggle';
import { WorkflowAckButton } from '@/components/admin/workflow-ack-button';
import { RulePackCatalog } from '@/components/admin/rule-pack-catalog';
import { RULE_PACKS } from '@/modules/admin-config/rule-packs/catalog';
import { EmptyState } from '@/components/ui/empty-state';

export default async function AdminWorkflowsPage() {
  const { role, tenantId: tenant_id } = await getPageAuth();
  const supabase = await createClient();

  // Tenant Admin manages workflows; MLRO can acknowledge but not activate.
  // Both reach this page; permission gate is per-action below.
  if (!hasPermission(role, 'admin:activate_workflow') && role !== Role.MLRO) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm font-medium text-red-900">Access denied</p>
        <p className="text-sm text-red-700 mt-1">You do not have permission to view workflows.</p>
      </div>
    );
  }

  type WorkflowRow = {
    id: string;
    name: string;
    version: number;
    is_active: boolean;
    created_at: string;
    tenant_id: string | null;
  };
  const { data: rawWorkflows } = await supabase
    .from('workflow_definitions')
    .select('id, name, version, is_active, created_at, tenant_id')
    .or(`tenant_id.eq.${tenant_id},tenant_id.is.null`)
    .order('name', { ascending: true });
  const workflows = (rawWorkflows ?? []) as unknown as WorkflowRow[];

  // Fetch active acknowledgements for tenant-scoped workflows so the table
  // can show ack state and gate activation.
  const tenantWorkflowIds = workflows
    .filter((w) => w.tenant_id !== null)
    .map((w) => w.id);
  const ackByWorkflow = new Map<string, { version: number; acknowledged_at: string }[]>();
  if (tenantWorkflowIds.length > 0) {
    const { data: ackRows } = await supabase
      .from('workflow_activation_acks')
      .select('workflow_id, workflow_version, acknowledged_at, revoked_at')
      .in('workflow_id', tenantWorkflowIds)
      .is('revoked_at', null);
    for (const a of (ackRows ?? []) as {
      workflow_id: string;
      workflow_version: number;
      acknowledged_at: string;
    }[]) {
      const list = ackByWorkflow.get(a.workflow_id) ?? [];
      list.push({ version: a.workflow_version, acknowledged_at: a.acknowledged_at });
      ackByWorkflow.set(a.workflow_id, list);
    }
  }

  const canToggle = hasPermission(role, 'admin:activate_workflow');
  const canAcknowledge = role === Role.MLRO;

  // Compute which rule packs the tenant has already cloned (by checking
  // metadata.cloned_from.pack_id on tenant-scoped workflows). This drives
  // the "Already cloned" badge on the catalog cards.
  let alreadyClonedPackIds: string[] = [];
  if (canToggle) {
    const { data: tenantWorkflows } = await supabase
      .from('workflow_definitions')
      .select('definition')
      .eq('tenant_id', tenant_id);
    alreadyClonedPackIds = ((tenantWorkflows ?? []) as { definition: Record<string, unknown> }[])
      .map((w) => {
        const meta = w.definition?.metadata as Record<string, unknown> | undefined;
        const cloned = meta?.cloned_from as { pack_id?: string } | undefined;
        return cloned?.pack_id;
      })
      .filter((id): id is string => typeof id === 'string');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Workflows</h1>
        <p className="text-sm text-gray-500 mt-1">
          Onboarding workflow definitions. Tenant-scoped activations require MLRO acknowledgement.
        </p>
      </div>

      {/* Regulator rule packs — only Tenant Admin sees the catalog (MLRO
          only acknowledges; doesn't clone). */}
      {canToggle && (
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Regulator templates</h2>
            <p className="text-sm text-gray-500 mt-1">
              Pre-configured workflows tuned to UAE regulators. Clone one to seed a tenant-scoped
              workflow that you can then customize and activate (with MLRO acknowledgement).
            </p>
          </div>
          <RulePackCatalog
            packs={RULE_PACKS}
            alreadyClonedPackIds={alreadyClonedPackIds}
            canClone={canToggle}
          />
        </section>
      )}

      {workflows.length === 0 ? (
        <EmptyState
          icon={<GitBranch className="h-5 w-5" />}
          title="No workflow definitions found"
          description="Run the database migrations to seed default individual KYC and corporate KYB workflows. Tenant Admins can clone and customize them once present."
          hint="Tenant-scoped activations require MLRO acknowledgement before going live."
        />
      ) : (
        <div className="rounded-lg bg-white border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workflow</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MLRO Ack</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {workflows.map((w) => {
                const isPlatformLevel = w.tenant_id === null;
                const acks = ackByWorkflow.get(w.id) ?? [];
                const hasAckForVersion = acks.some((a) => a.version === w.version);

                return (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{w.name}</td>
                    <td className="px-4 py-3 text-gray-500">v{w.version}</td>
                    <td className="px-4 py-3">
                      {w.is_active ? (
                        <span className="inline-flex items-center rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
                      ) : (
                        <span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {isPlatformLevel ? 'Platform default' : 'Tenant'}
                    </td>
                    <td className="px-4 py-3">
                      {isPlatformLevel ? (
                        <span className="text-xs text-gray-400 italic">Not required</span>
                      ) : hasAckForVersion ? (
                        <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">Acknowledged</span>
                      ) : (
                        <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Required</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        {canToggle && (
                          <WorkflowToggle
                            workflowId={w.id}
                            workflowName={w.name}
                            initialActive={w.is_active}
                            isPlatformLevel={isPlatformLevel}
                          />
                        )}
                        {canAcknowledge && !isPlatformLevel && !hasAckForVersion && !w.is_active && (
                          <WorkflowAckButton
                            workflowId={w.id}
                            workflowName={w.name}
                            workflowVersion={w.version}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
