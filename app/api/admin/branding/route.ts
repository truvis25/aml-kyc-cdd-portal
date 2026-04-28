import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.service';
import { assertPermission } from '@/modules/auth/rbac';
import { createClient } from '@/lib/supabase/server';
import * as audit from '@/modules/audit/audit.service';
import { AuditEntityType, AuditEventType } from '@/lib/constants/events';
import {
  getLatestTenantConfig,
  recordTenantConfigVersion,
} from '@/modules/admin-config/admin-config.service';
import { log } from '@/lib/logger';

/**
 * Logo upload via multipart/form-data → tenant-branding bucket. On success,
 * the canonical public URL is recorded as a new tenant_config version so the
 * change is audited and the previous logo is preserved by the version chain.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'admin:manage_config');

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }
    if (file.size > 512 * 1024) {
      return NextResponse.json({ error: 'logo must be ≤ 512KB' }, { status: 400 });
    }
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: `mime type ${file.type} not allowed` },
        { status: 400 },
      );
    }

    // Use a stable path per tenant so the public URL is predictable. The
    // file extension is normalised by mime type so older logos are
    // overwritten by upsert rather than orphaned.
    const ext =
      file.type === 'image/svg+xml'
        ? 'svg'
        : file.type === 'image/jpeg'
          ? 'jpg'
          : file.type === 'image/webp'
            ? 'webp'
            : 'png';
    const path = `${auth.user.tenant_id}/logo.${ext}`;

    const supabase = await createClient();
    const { error: uploadError } = await supabase.storage
      .from('tenant-branding')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: pub } = supabase.storage.from('tenant-branding').getPublicUrl(path);
    // Append cache-buster so browsers pick up the replacement.
    const logoUrl = `${pub.publicUrl}?v=${Date.now()}`;

    // Record a new tenant_config version with the new logo_url.
    const current = await getLatestTenantConfig(auth.user.tenant_id);
    const nextConfig = {
      ...current.config,
      branding: { ...current.config.branding, logo_url: logoUrl },
    };
    const row = await recordTenantConfigVersion({
      tenant_id: auth.user.tenant_id,
      config: nextConfig,
      notes: 'logo uploaded',
      actor_id: auth.user.id,
      actor_role: auth.user.role,
    });

    await audit.emit({
      tenant_id: auth.user.tenant_id,
      event_type: AuditEventType.CONFIG_CHANGED,
      entity_type: AuditEntityType.TENANT,
      entity_id: auth.user.tenant_id,
      actor_id: auth.user.id,
      actor_role: auth.user.role,
      payload: { field: 'branding.logo_url', tenant_config_version: row.version },
    });

    return NextResponse.json({ logo_url: logoUrl, tenant_config: row }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    log.error('POST /api/admin/branding error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Removes the logo (clears `branding.logo_url`). The old object is left in
 * the bucket — replacement uploads upsert by path, so disk usage stays
 * bounded.
 */
export async function DELETE() {
  try {
    const auth = await requireAuth();
    assertPermission(auth.user.role, 'admin:manage_config');

    const current = await getLatestTenantConfig(auth.user.tenant_id);
    if (!current.config.branding.logo_url) {
      return NextResponse.json({ logo_url: null });
    }

    const nextConfig = {
      ...current.config,
      branding: { ...current.config.branding, logo_url: null },
    };
    const row = await recordTenantConfigVersion({
      tenant_id: auth.user.tenant_id,
      config: nextConfig,
      notes: 'logo removed',
      actor_id: auth.user.id,
      actor_role: auth.user.role,
    });

    return NextResponse.json({ logo_url: null, tenant_config: row });
  } catch (err) {
    if (err instanceof Response) return err;
    log.error('DELETE /api/admin/branding error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
