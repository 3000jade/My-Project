import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import config from '../config';

export interface DbHealthReport {
  isConfigured: boolean;
  supabaseUrl: string;
  latencyMs?: number;
  tables: {
    properties: { count: number; accessible: boolean; error?: string };
    profiles: { count: number; accessible: boolean; error?: string };
    inquiries: { count: number; accessible: boolean; error?: string };
    appointments: { count: number; accessible: boolean; error?: string };
  };
  adminClearance: boolean;
  status: 'CONNECTED' | 'FALLBACK_DEV' | 'ERROR';
  message: string;
}

export async function checkDatabaseHealth(): Promise<DbHealthReport> {
  const report: DbHealthReport = {
    isConfigured: isSupabaseConfigured,
    supabaseUrl: config.supabaseUrl || 'Not set',
    tables: {
      properties: { count: 0, accessible: false },
      profiles: { count: 0, accessible: false },
      inquiries: { count: 0, accessible: false },
      appointments: { count: 0, accessible: false },
    },
    adminClearance: false,
    status: 'FALLBACK_DEV',
    message: '',
  };

  if (!isSupabaseConfigured) {
    report.status = 'FALLBACK_DEV';
    report.message =
      'Supabase credentials are unconfigured or using placeholders. Backend is running in local in-memory fallback mode.';
    return report;
  }

  const start = Date.now();

  try {
    // 1. Test Properties Table
    const { count: propCount, error: propError } = await supabase
      .from('properties')
      .select('id', { count: 'exact' })
      .limit(1);

    if (!propError) {
      report.tables.properties = { count: propCount || 0, accessible: true };
    } else {
      report.tables.properties = { count: 0, accessible: false, error: propError.message };
    }

    // 2. Test Profiles Table
    const { count: profCount, error: profError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .limit(1);

    if (!profError) {
      report.tables.profiles = { count: profCount || 0, accessible: true };
    } else {
      report.tables.profiles = { count: 0, accessible: false, error: profError.message };
    }

    // 3. Test Inquiries Table
    const { count: inqCount, error: inqError } = await supabase
      .from('inquiries')
      .select('id', { count: 'exact' })
      .limit(1);

    if (!inqError) {
      report.tables.inquiries = { count: inqCount || 0, accessible: true };
    } else {
      report.tables.inquiries = { count: 0, accessible: false, error: inqError.message };
    }

    // 4. Test Appointments Table
    const { count: apptCount, error: apptError } = await supabase
      .from('appointments')
      .select('id', { count: 'exact' })
      .limit(1);

    if (!apptError) {
      report.tables.appointments = { count: apptCount || 0, accessible: true };
    } else {
      report.tables.appointments = { count: 0, accessible: false, error: apptError.message };
    }

    // 5. Test Admin Service Role Clearance
    if (config.supabaseServiceRoleKey) {
      const { error: adminError } = await supabaseAdmin
        .from('profiles')
        .select('id', { head: true });
      report.adminClearance = !adminError;
    }

    report.latencyMs = Date.now() - start;
    report.status = 'CONNECTED';
    report.message = `Successfully connected to Supabase Cloud in ${report.latencyMs}ms.`;
  } catch (err: any) {
    report.status = 'ERROR';
    report.message = `Database connection failed: ${err.message}`;
  }

  return report;
}

// Direct execution in CLI
async function run() {
  console.log('\n================================================================');
  console.log('  CP_kerby Luxury Architectural Platform - Database Diagnostics ');
  console.log('================================================================\n');

  const report = await checkDatabaseHealth();

  console.log(`Connection Status : ${report.status}`);
  console.log(`Supabase URL      : ${report.supabaseUrl}`);
  if (report.latencyMs !== undefined) {
    console.log(`Ping Latency      : ${report.latencyMs}ms`);
  }
  console.log(`Admin Clearance   : ${report.adminClearance ? 'ACTIVE (Service Role OK)' : 'INACTIVE'}`);
  console.log(`Diagnosis         : ${report.message}\n`);

  console.log('--- Table Status & Row Counts ---');
  Object.entries(report.tables).forEach(([name, info]) => {
    const status = info.accessible ? `READY (${info.count} rows)` : `FAIL: ${info.error || 'Inaccessible'}`;
    console.log(` • ${name.padEnd(14)} : ${status}`);
  });
  console.log('\n================================================================\n');
}

if (process.argv[1]?.includes('test-db-connection')) {
  run().catch(console.error);
}
