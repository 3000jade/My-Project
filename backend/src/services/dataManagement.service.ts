import { createHash } from 'node:crypto';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { AuditService } from './audit.service';

export type BackupTable = 'properties' | 'inquiries' | 'sales';

export interface DataActor {
  id: string;
  role: string;
  name?: string;
}

export interface BackupSummaryItem {
  table: BackupTable;
  count: number;
}

export interface RecentBackupActivity {
  id: string;
  timestamp: string;
  actorName: string;
  totalRecords: number;
  sha256Prefix: string;
}

export interface BackupSummaryResponse {
  tables: BackupSummaryItem[];
  estimatedBytes: number;
  cooldownRemainingSec: number;
  lastBackupAt: string | null;
  recentBackups: RecentBackupActivity[];
}

export interface BackupMetadata {
  schema_version: string;
  exported_at: string;
  timezone: string;
  record_counts: Record<BackupTable, number>;
  sha256: string;
}

export interface BackupSnapshotPayload {
  _metadata: BackupMetadata;
  tables: Record<BackupTable, Record<string, unknown>[]>;
}

export interface RestoreTablePreview {
  willAdd: number;
  alreadyExists: number;
  errors: number;
}

export interface RestorePreviewResponse {
  valid: boolean;
  schemaVersion: string;
  sha256Prefix: string;
  tables: Record<BackupTable, RestoreTablePreview>;
  totalWillAdd: number;
  totalAlreadyExists: number;
  totalErrors: number;
}

export interface RestoreCommitResponse {
  safetySnapshot: BackupSnapshotPayload;
  insertedCounts: Record<BackupTable, number>;
  skippedCounts: Record<BackupTable, number>;
}

const BACKUP_TABLES: BackupTable[] = ['properties', 'inquiries', 'sales'];
const SUPPORTED_SCHEMA_VERSION = '1.0';
const COOLDOWN_MS = 5 * 60 * 1000;

// Lightweight average JSON byte weight per row for fast pre-export size estimation
const AVG_ROW_BYTES: Record<BackupTable, number> = {
  properties: 1400,
  inquiries: 850,
  sales: 700,
};

let isExportInProgress = false;
let lastExportAtMs = 0;

// In-memory store used only when Supabase env vars are not configured (local dev/tests)
const mockBackupStore: Record<BackupTable, Record<string, unknown>[]> = {
  properties: [
    { id: 'prop-1', title: 'Makati Sky Residence', price: 18500000, status: 'ACTIVE' },
    { id: 'prop-2', title: 'Alabang Courtyard Villa', price: 24000000, status: 'ARCHIVED' },
  ],
  inquiries: [
    { id: 'inq-1', client_name: 'Clara Santos', client_email: 'clara@example.com', status: 'NEW' },
  ],
  sales: [
    { id: 'sale-1', property_id: 'prop-1', sale_price: 18200000, status: 'COMPLETED' },
  ],
};

function assertAdmin(actor: DataActor): void {
  if (actor.role !== 'admin') {
    throw new Error('Forbidden: Only admin may access Data Management backups.');
  }
}

function getCooldownRemainingSec(): number {
  if (lastExportAtMs <= 0) return 0;
  const remainingMs = COOLDOWN_MS - (Date.now() - lastExportAtMs);
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

function verifySnapshot(snapshot: unknown): BackupSnapshotPayload {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('Invalid Backup: File must be a JSON object.');
  }
  const candidate = snapshot as Partial<BackupSnapshotPayload>;
  const meta = candidate._metadata;
  const tables = candidate.tables;

  if (!meta || typeof meta !== 'object' || !tables || typeof tables !== 'object') {
    throw new Error('Invalid Backup: Missing _metadata or tables section.');
  }
  if (meta.schema_version !== SUPPORTED_SCHEMA_VERSION) {
    throw new Error(
      `Invalid Backup: Unsupported schema_version '${String(meta.schema_version || '')}'. Expected '${SUPPORTED_SCHEMA_VERSION}'.`
    );
  }
  for (const table of BACKUP_TABLES) {
    if (!Array.isArray(tables[table])) {
      throw new Error(`Invalid Backup: Missing or invalid '${table}' array.`);
    }
  }

  // Recompute SHA-256 over canonical table order matching exportSnapshot
  const canonicalTables = Object.fromEntries(
    BACKUP_TABLES.map((t) => [t, tables[t]])
  ) as Record<BackupTable, Record<string, unknown>[]>;
  const actualHash = createHash('sha256').update(JSON.stringify(canonicalTables)).digest('hex');

  if (!meta.sha256 || actualHash !== meta.sha256) {
    throw new Error('Invalid Backup: SHA-256 checksum mismatch. The file may be corrupted or modified.');
  }

  return { _metadata: meta, tables: canonicalTables };
}

async function getExistingIds(table: BackupTable): Promise<Set<string>> {
  if (!isSupabaseConfigured) {
    return new Set(mockBackupStore[table].map((row) => String(row.id)));
  }
  const { data, error } = await supabaseAdmin.from(table).select('id');
  if (error) throw new Error(error.message);
  return new Set((data || []).map((row: any) => String(row.id)));
}

export class DataManagementService {
  public static resetBackupGuardForTesting(): void {
    isExportInProgress = false;
    lastExportAtMs = 0;
  }

  /**
   * Admin-only: returns record counts, estimated payload size, cooldown state, and recent backup activity.
   */
  public static async getBackupSummary(actor: DataActor): Promise<BackupSummaryResponse> {
    assertAdmin(actor);
    const tables: BackupSummaryItem[] = [];
    let estimatedBytes = 0;

    for (const table of BACKUP_TABLES) {
      let rowCount = 0;
      if (!isSupabaseConfigured) {
        rowCount = mockBackupStore[table].length;
      } else {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('id', { count: 'exact', head: true });
        if (error) throw new Error(error.message);
        rowCount = count ?? 0;
      }
      tables.push({ table, count: rowCount });
      estimatedBytes += rowCount * AVG_ROW_BYTES[table];
    }

    let recentBackups: RecentBackupActivity[] = [];
    try {
      const events = await AuditService.listAuditEvents(
        { eventType: 'data_management.backup_snapshot', limit: 5 },
        { actorId: actor.id, actorRole: actor.role }
      );
      recentBackups = events.slice(0, 5).map((ev: any) => {
        const countsObj = ev.newValues?.counts || {};
        const totalRecords = Object.values(countsObj).reduce<number>(
          (sum, val) => sum + (typeof val === 'number' ? val : 0),
          0
        );
        return {
          id: String(ev.id || ev.createdAt),
          timestamp: String(ev.createdAt || new Date().toISOString()),
          actorName: String(ev.actorName || 'Admin'),
          totalRecords,
          sha256Prefix: String(ev.newValues?.sha256 || '—'),
        };
      });
    } catch {
      recentBackups = [];
    }

    return {
      tables,
      estimatedBytes,
      cooldownRemainingSec: getCooldownRemainingSec(),
      lastBackupAt: recentBackups[0]?.timestamp || null,
      recentBackups,
    };
  }

  /**
   * Admin-only: generates an on-demand JSON backup snapshot with SHA-256 verification.
   * shortcut: In-memory cooldown/lock & on-demand snapshot; upgrade to Redis lock + background worker if multi-instance or >50MB.
   */
  public static async exportSnapshot(
    actor: DataActor,
    options: { bypassCooldown?: boolean } = {}
  ): Promise<BackupSnapshotPayload> {
    assertAdmin(actor);

    if (isExportInProgress) {
      throw new Error('Too Many Requests: A backup export is already in progress.');
    }
    const remainingSec = getCooldownRemainingSec();
    if (!options.bypassCooldown && remainingSec > 0) {
      throw new Error(`Too Many Requests: Please wait ${remainingSec}s before starting another backup.`);
    }

    isExportInProgress = true;
    try {
      const tables = {} as Record<BackupTable, Record<string, unknown>[]>;
      for (const table of BACKUP_TABLES) {
        if (!isSupabaseConfigured) {
          tables[table] = [...mockBackupStore[table]];
        } else {
          const { data, error } = await supabaseAdmin.from(table).select('*');
          if (error) throw new Error(error.message);
          tables[table] = (data || []) as Record<string, unknown>[];
        }
      }

      const recordCounts = Object.fromEntries(
        BACKUP_TABLES.map((t) => [t, tables[t].length])
      ) as Record<BackupTable, number>;

      const serializedTables = JSON.stringify(tables);
      const parsedCheck = JSON.parse(serializedTables) as Record<BackupTable, unknown[]>;
      for (const table of BACKUP_TABLES) {
        if (!Array.isArray(parsedCheck[table]) || parsedCheck[table].length !== recordCounts[table]) {
          throw new Error(`Backup verification failed for table '${table}'.`);
        }
      }

      const sha256 = createHash('sha256').update(serializedTables).digest('hex');
      const exportedAt = new Date().toISOString();

      await AuditService.recordEvent({
        eventType: 'data_management.backup_snapshot',
        actorId: actor.id,
        actorName: actor.name || actor.role,
        actorType: 'human',
        actorRole: actor.role,
        targetType: 'system',
        targetId: options.bypassCooldown ? 'pre_restore_safety_snapshot' : 'backup_snapshot',
        outcome: 'success',
        newValues: {
          counts: recordCounts,
          sha256: sha256.slice(0, 12),
        },
      });

      if (!options.bypassCooldown) {
        lastExportAtMs = Date.now();
      }

      return {
        _metadata: {
          schema_version: SUPPORTED_SCHEMA_VERSION,
          exported_at: exportedAt,
          timezone: 'Asia/Manila',
          record_counts: recordCounts,
          sha256,
        },
        tables,
      };
    } finally {
      isExportInProgress = false;
    }
  }

  /**
   * Admin-only: non-destructive Dry-Run preview verifying SHA-256 and counting records to add vs. skip.
   */
  public static async previewRestore(actor: DataActor, snapshotInput: unknown): Promise<RestorePreviewResponse> {
    assertAdmin(actor);
    const snapshot = verifySnapshot(snapshotInput);

    const tablesPreview = {} as Record<BackupTable, RestoreTablePreview>;
    let totalWillAdd = 0;
    let totalAlreadyExists = 0;
    let totalErrors = 0;

    for (const table of BACKUP_TABLES) {
      const existingIds = await getExistingIds(table);
      let willAdd = 0;
      let alreadyExists = 0;
      let errors = 0;

      for (const row of snapshot.tables[table]) {
        if (!row || typeof row !== 'object' || !row.id) {
          errors += 1;
        } else if (existingIds.has(String(row.id))) {
          alreadyExists += 1;
        } else {
          willAdd += 1;
        }
      }

      tablesPreview[table] = { willAdd, alreadyExists, errors };
      totalWillAdd += willAdd;
      totalAlreadyExists += alreadyExists;
      totalErrors += errors;
    }

    return {
      valid: totalErrors === 0,
      schemaVersion: snapshot._metadata.schema_version,
      sha256Prefix: snapshot._metadata.sha256.slice(0, 12),
      tables: tablesPreview,
      totalWillAdd,
      totalAlreadyExists,
      totalErrors,
    };
  }

  /**
   * Admin-only: generates a mandatory Pre-Restore Safety Snapshot, then merges missing records safely.
   * shortcut: Per-table upsert with reverse-order rollback cleanup; upgrade to a Postgres RPC for single-SQL-transaction isolation under concurrent writes.
   */
  public static async commitRestore(actor: DataActor, snapshotInput: unknown): Promise<RestoreCommitResponse> {
    assertAdmin(actor);
    const snapshot = verifySnapshot(snapshotInput);
    const safetySnapshot = await this.exportSnapshot(actor, { bypassCooldown: true });

    const insertedCounts: Record<BackupTable, number> = { properties: 0, inquiries: 0, sales: 0 };
    const skippedCounts: Record<BackupTable, number> = { properties: 0, inquiries: 0, sales: 0 };
    const insertedIdsByTable: Record<BackupTable, string[]> = { properties: [], inquiries: [], sales: [] };

    try {
      for (const table of BACKUP_TABLES) {
        const existingIds = await getExistingIds(table);
        const rowsToInsert: Record<string, unknown>[] = [];

        for (const row of snapshot.tables[table]) {
          if (!row || typeof row !== 'object' || !row.id) {
            throw new Error(`Invalid Backup: Found a row in '${table}' without an id.`);
          }
          const rowId = String(row.id);
          if (existingIds.has(rowId)) {
            skippedCounts[table] += 1;
          } else {
            rowsToInsert.push(row);
            insertedIdsByTable[table].push(rowId);
          }
        }

        if (rowsToInsert.length > 0) {
          if (!isSupabaseConfigured) {
            mockBackupStore[table].push(...rowsToInsert);
          } else {
            const { error } = await supabaseAdmin
              .from(table)
              .upsert(rowsToInsert, { onConflict: 'id', ignoreDuplicates: true });
            if (error) throw new Error(error.message);
          }
          insertedCounts[table] = rowsToInsert.length;
        }
      }
    } catch (err) {
      // Roll back newly inserted IDs in reverse dependency order
      for (const table of [...BACKUP_TABLES].reverse()) {
        const ids = insertedIdsByTable[table];
        if (ids.length === 0) continue;
        if (!isSupabaseConfigured) {
          const idSet = new Set(ids);
          mockBackupStore[table] = mockBackupStore[table].filter((r) => !idSet.has(String(r.id)));
        } else {
          await supabaseAdmin.from(table).delete().in('id', ids);
        }
      }
      throw err;
    }

    await AuditService.recordEvent({
      eventType: 'data_management.restore_commit',
      actorId: actor.id,
      actorName: actor.name || actor.role,
      actorType: 'human',
      actorRole: actor.role,
      targetType: 'system',
      targetId: 'restore_safe_merge',
      outcome: 'success',
      newValues: {
        insertedCounts,
        skippedCounts,
        safetySha256: safetySnapshot._metadata.sha256.slice(0, 12),
      },
    });

    return { safetySnapshot, insertedCounts, skippedCounts };
  }
}
