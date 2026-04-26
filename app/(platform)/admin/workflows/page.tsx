import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/modules/auth/rbac';
import { getPageAuth } from '@/lib/auth/page-auth';

export default async function AdminWorkflowsPage() {
  const { role, tenantId: tenant_id } = await getPageAuth();
  const supabase = await createClient();

  if (!hasPermission(role, 'admin:activate_workflow')) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm font-medium text-red-900">Access denied</p>
        <p className="text-sm text-red-700 mt-1">You do not have permission to manage workflows.</p>
      </div>
    );
  }

  type WorkflowRow = { id: string; name: string; version: number; is_active: boolean; created_at: string };
  const { data: rawWorkflows } = await supabase
    .from('workflow_definitions')
    .select('id, name, version, is_active, created_at')
    .or(`tenant_id.eq.${tenant_id},tenant_id.is.null`)
    .order('name', { ascending: true });
  const workflows = (rawWorkflows ?? []) as unknown as WorkflowRow[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Workflows</h1>
        <p className="text-sm text-gray-500 mt-1">Onboarding workflow definitions</p>
      </div>

      {(!workflows || workflows.length === 0) ? (
        <div className="rounded-lg bg-white border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No workflow definitions found.</p>
          <p className="text-xs text-gray-400 mt-1">Run the database migrations to seed default workflows.</p>
        </div>
      ) : (
        <div className="rounded-lg bg-white border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workflow</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {workflows.map((w) => (
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
                    {w.is_active ? 'Platform default' : 'Tenant'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(w.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
