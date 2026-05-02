import { createClient } from '@/lib/supabase/server';
import * as audit from '@/modules/audit/audit.service';
import { AuditEntityType, AuditEventType } from '@/lib/constants/events';
import {
  DEFAULT_TENANT_CONFIG,
  type TenantConfig,
  type TenantConfigRow,
} from './types';

/**
 * Returns the latest tenant_config row, or a default row populated from
 * DEFAULT_TENANT_CONFIG when no version has been written yet.
 */
export async function getLatestTenantConfig(
  tenant_id: string,
): Promise<TenantConfigRow> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tenant_config_latest')
    .select('config_id, tenant_id, version, config, notes, created_by, created_at')
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  if (data) {
    const row = data as TenantConfigRow;
    return {
      ...row,
      config: mergeWithDefaults(row.config),
    };
  }

  return {
    config_id: '',
    tenant_id,
    version: 0,
    config: { ...DEFAULT_TENANT_CONFIG },
    notes: null,
    created_by: null,
    created_at: new Date(0).toISOString(),
  };
}

interface UpdateParams {
  tenant_id: string;
  config: TenantConfig;
  notes?: string;
  actor_id: string;
  actor_role: string;
}

export async function recordTenantConfigVersion(params: UpdateParams): Promise<TenantConfigRow> {
  const supabase = await createClient();

  // Read the current max version to compute the next version number.
  const { data: maxRow } = await supabase
    .from('tenant_config')
    .select('version')
    .eq('tenant_id', params.tenant_id)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion =
    ((maxRow as { version: number }[] | null)?.[0]?.version ?? 0) + 1;

  const { data: inserted, error } = await supabase
    .from('tenant_config')
    .insert({
      tenant_id: params.tenant_id,
      version: nextVersion,
      config: params.config,
      notes: params.notes ?? null,
      created_by: params.actor_id,
    })
    .select('id, tenant_id, version, config, notes, created_by, created_at')
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to record tenant_config version: ${error?.message ?? 'unknown'}`);
  }

  await audit.emit({
    tenant_id: params.tenant_id,
    event_type: AuditEventType.CONFIG_CHANGED,
    entity_type: AuditEntityType.TENANT,
    entity_id: params.tenant_id,
    actor_id: params.actor_id,
    actor_role: params.actor_role,
    payload: {
      // Don't dump the full config into audit_log (could grow large); record
      // metadata only. The tenant_config row is the canonical artefact.
      version: nextVersion,
      notes: params.notes ?? null,
    },
  });

  const row = inserted as {
    id: string;
    tenant_id: string;
    version: number;
    config: TenantConfig;
    notes: string | null;
    created_by: string | null;
    created_at: string;
  };

  return {
    config_id: row.id,
    tenant_id: row.tenant_id,
    version: row.version,
    config: mergeWithDefaults(row.config),
    notes: row.notes,
    created_by: row.created_by,
    created_at: row.created_at,
  };
}

export async function listTenantConfigVersions(
  tenant_id: string,
  limit = 20,
): Promise<TenantConfigRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tenant_config')
    .select('id, tenant_id, version, config, notes, created_by, created_at')
    .eq('tenant_id', tenant_id)
    .order('version', { ascending: false })
    .limit(limit);

  return ((data ?? []) as Array<{
    id: string;
    tenant_id: string;
    version: number;
    config: TenantConfig;
    notes: string | null;
    created_by: string | null;
    created_at: string;
  }>).map((row) => ({
    config_id: row.id,
    tenant_id: row.tenant_id,
    version: row.version,
    config: mergeWithDefaults(row.config),
    notes: row.notes,
    created_by: row.created_by,
    created_at: row.created_at,
  }));
}

/**
 * Shallow-deep merge: every top-level group falls back to defaults if a
 * field is missing. Keeps older config rows readable when new fields are
 * added in later releases. Exported for unit testing.
 */
export function mergeWithDefaults(stored: Partial<TenantConfig> | null | undefined): TenantConfig {
  const s = stored ?? {};
  return {
    modules: { ...DEFAULT_TENANT_CONFIG.modules, ...(s.modules ?? {}) },
    documents: { ...DEFAULT_TENANT_CONFIG.documents, ...(s.documents ?? {}) },
    risk_thresholds: {
      ...DEFAULT_TENANT_CONFIG.risk_thresholds,
      ...(s.risk_thresholds ?? {}),
    },
    screening: { ...DEFAULT_TENANT_CONFIG.screening, ...(s.screening ?? {}) },
    branding: { ...DEFAULT_TENANT_CONFIG.branding, ...(s.branding ?? {}) },
    flags: { ...DEFAULT_TENANT_CONFIG.flags, ...(s.flags ?? {}) },
  };
}
