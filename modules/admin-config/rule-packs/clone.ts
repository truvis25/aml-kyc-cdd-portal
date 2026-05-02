import { createClient } from '@/lib/supabase/server';
import * as audit from '@/modules/audit/audit.service';
import { AuditEntityType, AuditEventType } from '@/lib/constants/events';
import { getRulePackById } from './catalog';

export interface ClonedWorkflow {
  id: string;
  name: string;
  version: number;
  customer_type: string;
  is_active: boolean;
}

export interface CloneRulePackParams {
  sourceWorkflowId: string;
  tenantId: string;
  actorId: string;
  actorRole: string;
}

/**
 * Clones a platform-level rule pack into a tenant-scoped workflow.
 *
 * The new row:
 *   - tenant_id  = tenant's id (so it shows in the tenant's workflows table)
 *   - name       = "<pack-name>-<tenant-slug-suffix>" — but we don't have the
 *                  slug here, so we keep the pack name and let the unique
 *                  constraint (tenant_id, customer_type, version) handle it
 *   - version    = max(existing for this tenant + customer_type) + 1
 *   - is_active  = false (always; tenant must activate after MLRO ack)
 *   - definition = deep copy of the platform definition with `metadata.cloned_from`
 *                  set so reviewers can see where it came from
 *
 * The caller is responsible for asserting permission
 * (admin:activate_workflow). RLS on workflow_definitions does the same
 * check at the DB layer.
 */
export async function cloneRulePack(params: CloneRulePackParams): Promise<ClonedWorkflow> {
  const supabase = await createClient();
  const pack = getRulePackById(params.sourceWorkflowId);
  if (!pack) {
    throw new Error('Unknown rule pack — only platform-level templates can be cloned.');
  }

  // Read the platform-level workflow row.
  const { data: source, error: sourceError } = await supabase
    .from('workflow_definitions')
    .select('id, name, customer_type, definition, tenant_id')
    .eq('id', params.sourceWorkflowId)
    .maybeSingle();
  if (sourceError) {
    throw new Error(`Failed to read source workflow: ${sourceError.message}`);
  }
  if (!source) {
    throw new Error('Source workflow not found.');
  }
  const sourceRow = source as {
    id: string;
    name: string;
    customer_type: string;
    definition: Record<string, unknown>;
    tenant_id: string | null;
  };
  if (sourceRow.tenant_id !== null) {
    // We refuse to clone tenant-scoped rows here — that's a different flow
    // (forking a tenant's own workflow). Keep this endpoint single-purpose.
    throw new Error('Source must be a platform-level rule pack.');
  }

  // Compute the next version for (tenant, customer_type). We do this after
  // confirming pack identity so a non-existent pack errors before we ever
  // touch the tenant's own rows.
  const { data: existing, error: existingError } = await supabase
    .from('workflow_definitions')
    .select('version')
    .eq('tenant_id', params.tenantId)
    .eq('customer_type', sourceRow.customer_type)
    .order('version', { ascending: false })
    .limit(1);
  if (existingError) {
    throw new Error(`Failed to compute next version: ${existingError.message}`);
  }
  const nextVersion =
    ((existing?.[0] as { version: number } | undefined)?.version ?? 0) + 1;

  // Deep-copy the definition and stamp provenance metadata. We keep the
  // existing metadata block (regulator, jurisdiction, etc.) and add a
  // cloned_from sub-block so the audit reviewer can see when and from
  // which pack the tenant's workflow was forked.
  const definition = JSON.parse(JSON.stringify(sourceRow.definition)) as Record<string, unknown>;
  const existingMeta = (definition.metadata as Record<string, unknown> | undefined) ?? {};
  definition.metadata = {
    ...existingMeta,
    cloned_from: {
      pack_id: sourceRow.id,
      pack_name: sourceRow.name,
      cloned_at: new Date().toISOString(),
      cloned_by: params.actorId,
    },
  };
  definition.version = nextVersion;

  const { data: inserted, error: insertError } = await supabase
    .from('workflow_definitions')
    .insert({
      tenant_id: params.tenantId,
      name: sourceRow.name,
      customer_type: sourceRow.customer_type,
      version: nextVersion,
      definition,
      is_active: false,
    })
    .select('id, name, version, customer_type, is_active')
    .single();
  if (insertError) {
    throw new Error(`Failed to insert cloned workflow: ${insertError.message}`);
  }
  const row = inserted as ClonedWorkflow;

  await audit.emit({
    tenant_id: params.tenantId,
    event_type: AuditEventType.WORKFLOW_ACTIVATED, // closest existing — this is the cloning event itself
    entity_type: AuditEntityType.WORKFLOW_DEFINITION,
    entity_id: row.id,
    actor_id: params.actorId,
    actor_role: params.actorRole,
    payload: {
      action: 'cloned_rule_pack',
      source_pack_id: sourceRow.id,
      source_pack_name: sourceRow.name,
      regulator: pack.regulator,
      jurisdiction: pack.jurisdiction,
      version: nextVersion,
    },
  });

  return row;
}
