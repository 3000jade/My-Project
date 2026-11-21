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

const BACKUP_TABLES: BackupTable[] = ['properties', 'inquiries', 'sales'];

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

export class DataManagementService {
  /**
   * Admin-only: returns record counts per table before downloading a backup.
   */
  public static async getBackupSummary(actor: DataActor): Promise<{ tables: BackupSummaryItem[] }> {
    assertAdmin(actor);
    const tables: BackupSummaryItem[] = [];

    for (const table of BACKUP_TABLES) {
      if (!isSupabaseConfigured) {
        tables.push({ table, count: mockBackupStore[table].length });
      } else {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('id', { count: 'exact', head: true });
        if (error) throw new Error(error.message);
        tables.push({ table, count: count ?? 0 });
      }
    }

    return { tables };
  }

  /**
   * Admin-only: generates an on-demand JSON backup snapshot of core tables and logs an audit receipt.
   * shortcut: On-demand snapshot instead of scheduled background worker; upgrade when dataset outgrows single-request memory.
   */
  public static async exportSnapshot(actor: DataActor): Promise<{
    generatedAt: string;
    tables: Record<BackupTable, Record<string, unknown>[]>;
  }> {
    assertAdmin(actor);

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

    await AuditService.recordEvent({
      eventType: 'data_management.backup_snapshot',
      actorId: actor.id,
      actorName: actor.name || actor.role,
      actorType: 'human',
      actorRole: actor.role,
      targetType: 'system',
      targetId: 'backup_snapshot',
      outcome: 'success',
      newValues: {
        counts: Object.fromEntries(BACKUP_TABLES.map((t) => [t, tables[t].length])),
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      tables,
    };
  }
}
