import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { AuditService } from './audit.service';

export type ManagedResource = 'properties' | 'inquiries' | 'sales';
export type ExportFormat = 'json' | 'csv';

export interface DataActor {
  id: string;
  role: string;
  name?: string;
}

export interface ImportRowError {
  rowIndex: number;
  reason: string;
}

export interface ImportPreviewResult {
  resource: ManagedResource;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  validRows: Record<string, unknown>[];
  invalidRows: ImportRowError[];
}

const ALLOWED_RESOURCES: ManagedResource[] = ['properties', 'inquiries', 'sales'];

// Required fields per resource for dry-run import validation
const REQUIRED_FIELDS: Record<ManagedResource, string[]> = {
  properties: ['title', 'price'],
  inquiries: ['client_name', 'client_email'],
  sales: ['property_id', 'sale_price'],
};

// Ownership column per resource for broker-scoped reads/writes
const OWNER_COLUMN: Record<ManagedResource, string> = {
  properties: 'created_by',
  inquiries: 'created_by',
  sales: 'agent_id',
};

// In-memory store used only when Supabase env vars are not configured (local dev/tests)
const mockStore: Record<ManagedResource, Record<string, any>[]> = {
  properties: [
    { id: 'prop-1', title: 'Makati Sky Residence', price: 18500000, status: 'ACTIVE', created_by: 'usr-broker-1' },
    { id: 'prop-2', title: 'Alabang Courtyard Villa', price: 24000000, status: 'ARCHIVED', created_by: 'usr-broker-2' },
  ],
  inquiries: [
    { id: 'inq-1', client_name: 'Clara Santos', client_email: 'clara@example.com', status: 'NEW', created_by: 'usr-broker-1' },
  ],
  sales: [
    { id: 'sale-1', property_id: 'prop-1', sale_price: 18200000, status: 'COMPLETED', agent_id: 'usr-broker-1' },
  ],
};

function assertResource(resource: string): ManagedResource {
  if (!ALLOWED_RESOURCES.includes(resource as ManagedResource)) {
    throw new Error(`Unsupported resource '${resource}'. Allowed: ${ALLOWED_RESOURCES.join(', ')}.`);
  }
  return resource as ManagedResource;
}

function assertActorScope(actor: DataActor): 'all' | 'own' {
  if (actor.role === 'admin') return 'all';
  if (actor.role === 'broker') return 'own';
  throw new Error('Forbidden: Only admin or broker roles may access Data Management tools.');
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const escape = (val: unknown) => {
    const str = val === null || val === undefined ? '' : String(val);
    return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

async function recordReceipt(
  actor: DataActor,
  eventType: string,
  targetType: string,
  targetId: string,
  newValues?: Record<string, unknown>
): Promise<void> {
  await AuditService.recordEvent({
    eventType,
    actorId: actor.id,
    actorName: actor.name || actor.role,
    actorType: 'human',
    actorRole: actor.role,
    targetType,
    targetId,
    outcome: 'success',
    newValues,
  });
}

export class DataManagementService {
  /**
   * Dry-run gate: validates import rows without writing to the database.
   */
  public static previewImport(
    actor: DataActor,
    resourceInput: string,
    rows: Record<string, unknown>[]
  ): ImportPreviewResult {
    assertActorScope(actor);
    const resource = assertResource(resourceInput);
    const required = REQUIRED_FIELDS[resource];

    const validRows: Record<string, unknown>[] = [];
    const invalidRows: ImportRowError[] = [];

    rows.forEach((row, index) => {
      if (!row || typeof row !== 'object') {
        invalidRows.push({ rowIndex: index, reason: 'Row must be an object.' });
        return;
      }
      const missing = required.filter((field) => {
        const val = row[field];
        return val === undefined || val === null || String(val).trim() === '';
      });
      if (missing.length > 0) {
        invalidRows.push({ rowIndex: index, reason: `Missing required field(s): ${missing.join(', ')}` });
        return;
      }
      validRows.push(row);
    });

    return {
      resource,
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      validRows,
      invalidRows,
    };
  }

  /**
   * Commits validated rows within the actor's role scope and logs an audit receipt.
   */
  public static async commitImport(
    actor: DataActor,
    resourceInput: string,
    rows: Record<string, unknown>[]
  ): Promise<{ insertedCount: number; skippedCount: number; invalidRows: ImportRowError[] }> {
    const scope = assertActorScope(actor);
    const preview = this.previewImport(actor, resourceInput, rows);

    if (preview.validRows.length === 0) {
      return { insertedCount: 0, skippedCount: preview.invalidCount, invalidRows: preview.invalidRows };
    }

    const ownerCol = OWNER_COLUMN[preview.resource];
    // Brokers can only import records owned by their own account
    const scopedRows = preview.validRows.map((row) =>
      scope === 'own' ? { ...row, [ownerCol]: actor.id } : row
    );

    if (!isSupabaseConfigured) {
      scopedRows.forEach((row, i) => {
        mockStore[preview.resource].push({
          id: `${preview.resource}-imp-${Date.now()}-${i}`,
          status: 'ACTIVE',
          ...row,
        });
      });
    } else {
      const { error } = await supabaseAdmin.from(preview.resource).insert(scopedRows);
      if (error) throw new Error(error.message);
    }

    await recordReceipt(actor, 'data_management.import_commit', preview.resource, 'bulk', {
      insertedCount: scopedRows.length,
      skippedCount: preview.invalidCount,
    });

    return {
      insertedCount: scopedRows.length,
      skippedCount: preview.invalidCount,
      invalidRows: preview.invalidRows,
    };
  }

  /**
   * Exports records scoped by role (admin: all, broker: own) and logs an audit receipt.
   */
  public static async exportRecords(
    actor: DataActor,
    resourceInput: string,
    format: ExportFormat = 'json'
  ): Promise<{ contentType: string; filename: string; body: string; count: number }> {
    const scope = assertActorScope(actor);
    const resource = assertResource(resourceInput);

    const ownerCol = OWNER_COLUMN[resource];
    let rows: Record<string, unknown>[] = [];

    if (!isSupabaseConfigured) {
      rows = mockStore[resource].filter((r) => (scope === 'own' ? r[ownerCol] === actor.id : true));
    } else {
      let query = supabaseAdmin.from(resource).select('*');
      if (scope === 'own') {
        query = query.eq(ownerCol, actor.id);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      rows = (data || []) as Record<string, unknown>[];
    }

    await recordReceipt(actor, 'data_management.export', resource, scope, {
      format,
      count: rows.length,
    });

    const dateTag = new Date().toISOString().slice(0, 10);
    if (format === 'csv') {
      return {
        contentType: 'text/csv',
        filename: `${resource}-${dateTag}.csv`,
        body: toCsv(rows),
        count: rows.length,
      };
    }

    return {
      contentType: 'application/json',
      filename: `${resource}-${dateTag}.json`,
      body: JSON.stringify(rows, null, 2),
      count: rows.length,
    };
  }

  /**
   * Admin-only: summarizes active vs. archived record counts across core tables.
   */
  public static async getDataHealth(actor: DataActor): Promise<{
    resources: Array<{ resource: ManagedResource; total: number; active: number; archived: number }>;
  }> {
    if (actor.role !== 'admin') {
      throw new Error('Forbidden: Only admin may inspect system data health.');
    }

    const resources: Array<{ resource: ManagedResource; total: number; active: number; archived: number }> = [];

    for (const resource of ALLOWED_RESOURCES) {
      if (!isSupabaseConfigured) {
        const rows = mockStore[resource];
        const archived = rows.filter((r) => r.status === 'ARCHIVED').length;
        resources.push({
          resource,
          total: rows.length,
          active: rows.length - archived,
          archived,
        });
      } else {
        const { data, error } = await supabaseAdmin.from(resource).select('id, status');
        if (error) throw new Error(error.message);
        const rows = data || [];
        const archived = rows.filter((r: any) => r.status === 'ARCHIVED').length;
        resources.push({
          resource,
          total: rows.length,
          active: rows.length - archived,
          archived,
        });
      }
    }

    return { resources };
  }

  /**
   * Admin-only: reversible soft-archive or restore of a record.
   */
  public static async setArchiveState(
    actor: DataActor,
    resourceInput: string,
    id: string,
    archived: boolean
  ): Promise<{ id: string; status: string }> {
    if (actor.role !== 'admin') {
      throw new Error('Forbidden: Only admin may archive or restore records.');
    }
    const resource = assertResource(resourceInput);
    const nextStatus = archived ? 'ARCHIVED' : 'ACTIVE';

    if (!isSupabaseConfigured) {
      const target = mockStore[resource].find((r) => r.id === id);
      if (!target) throw new Error(`Record '${id}' not found in ${resource}.`);
      target.status = nextStatus;
    } else {
      const { data, error } = await supabaseAdmin
        .from(resource)
        .update({ status: nextStatus })
        .eq('id', id)
        .select('id, status')
        .single();
      if (error || !data) throw new Error(error?.message || `Record '${id}' not found.`);
    }

    await recordReceipt(
      actor,
      archived ? 'data_management.archive' : 'data_management.restore',
      resource,
      id,
      { status: nextStatus }
    );

    return { id, status: nextStatus };
  }

  /**
   * Admin-only: generates an on-demand JSON snapshot of core tables.
   * shortcut: On-demand snapshot instead of scheduled background worker; upgrade when dataset outgrows single-request memory.
   */
  public static async exportSnapshot(actor: DataActor): Promise<{
    generatedAt: string;
    tables: Record<string, Record<string, unknown>[]>;
  }> {
    if (actor.role !== 'admin') {
      throw new Error('Forbidden: Only admin may export system backups.');
    }

    const tables: Record<string, Record<string, unknown>[]> = {};
    for (const resource of ALLOWED_RESOURCES) {
      if (!isSupabaseConfigured) {
        tables[resource] = [...mockStore[resource]];
      } else {
        const { data, error } = await supabaseAdmin.from(resource).select('*');
        if (error) throw new Error(error.message);
        tables[resource] = (data || []) as Record<string, unknown>[];
      }
    }

    await recordReceipt(actor, 'data_management.backup_snapshot', 'system', 'snapshot', {
      counts: Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.length])),
    });

    return {
      generatedAt: new Date().toISOString(),
      tables,
    };
  }
}
