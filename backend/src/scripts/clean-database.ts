import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';

async function cleanDatabase() {
  console.log('================================================================');
  console.log('  CP_kerby Luxury Architectural Platform - Database Cleanup     ');
  console.log('================================================================');

  if (!isSupabaseConfigured) {
    logger.error('Supabase is not configured. Aborting cleanup.');
    process.exit(1);
  }

  const tablesToClean = [
    { name: 'property_rooms', idCol: 'id' },
    { name: 'property_media', idCol: 'id' },
    { name: 'property_confidential', idCol: 'property_id' },
    { name: 'inquiries', idCol: 'id' },
    { name: 'appointments', idCol: 'id' },
    { name: 'notifications', idCol: 'id' },
    { name: 'agent_invitations', idCol: 'id' },
    { name: 'properties', idCol: 'id' },
  ];

  for (const table of tablesToClean) {
    try {
      // 1. Check existing count
      const { count: beforeCount, error: countErr } = await supabaseAdmin
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (countErr) {
        console.log(` • ${table.name.padEnd(24)}: SKIPPED / NOT FOUND (${countErr.message})`);
        continue;
      }

      // 2. Perform deletion
      const { error: deleteErr } = await supabaseAdmin
        .from(table.name)
        .delete()
        .not(table.idCol, 'is', null);

      if (deleteErr) {
        console.error(` • ${table.name.padEnd(24)}: ❌ FAILED (${deleteErr.message})`);
      } else {
        console.log(` • ${table.name.padEnd(24)}: ✅ CLEANED (${beforeCount || 0} rows removed)`);
      }
    } catch (err: any) {
      console.error(` • ${table.name.padEnd(24)}: ❌ EXCEPTION (${err.message})`);
    }
  }

  // 3. Verify profiles remain untouched
  const { count: profileCount } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  console.log('----------------------------------------------------------------');
  console.log(` Preserved User Profiles : ${profileCount || 0} accounts intact`);
  console.log('================================================================\n');
}

cleanDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal cleanup error:', err);
    process.exit(1);
  });
