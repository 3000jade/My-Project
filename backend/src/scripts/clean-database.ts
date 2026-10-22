import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';

export const CORE_USERS = [
  {
    email: 'admin@pt.com',
    password: 'adminPassword123!',
    fullName: 'Admin',
    role: 'admin',
  },
  {
    email: 'broker@pt.com',
    password: 'brokerPassword123!',
    fullName: 'Broker',
    role: 'broker',
  },
  {
    email: 'agent@pt.com',
    password: 'agentPassword123!',
    fullName: 'Agent',
    role: 'agent',
  },
  {
    email: 'client@pt.com',
    password: 'clientPassword123!',
    fullName: 'Client',
    role: 'client',
  },
];

const SEED_PROPERTY_IDS = [
  'a1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'c3333333-3333-3333-3333-333333333333',
  'd4444444-4444-4444-4444-444444444444',
  'e5555555-5555-5555-5555-555555555555',
  'f6666666-6666-6666-6666-666666666666',
];

export async function cleanDatabase() {
  console.log('================================================================');
  console.log('   Human Shelter Realty | Database Reset & Core Provisioning     ');
  console.log('================================================================\n');

  if (!isSupabaseConfigured) {
    console.error('❌ Supabase is not configured in environment. Aborting.');
    process.exit(1);
  }

  const coreEmailSet = new Set(CORE_USERS.map((u) => u.email.toLowerCase()));

  // ---------------------------------------------------------------------------
  // 1. Purge Transient Operational Tables
  // ---------------------------------------------------------------------------
  console.log('🧹 1. Purging transient operational tables...');

  const tablesToClear = [
    'notifications',
    'notification_queue',
    'communication_audit_logs',
    'agent_responsibility_transfers',
    'agent_audit_events',
    'agent_credential_documents',
    'agent_invitations',
    'agent_availability_schedules',
    'appointments',
    'inquiries',
  ];

  for (const table of tablesToClear) {
    try {
      const { error } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        // Table might not exist in remote schema or constraint
        console.log(`   [Info] ${table}: ${error.message}`);
      } else {
        console.log(`   ✓ Cleared ${table}`);
      }
    } catch (err: any) {
      console.log(`   [Skip] ${table}: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Remove Non-Seed Transient Properties
  // ---------------------------------------------------------------------------
  console.log('\n🏠 2. Cleaning custom/transient test properties...');
  try {
    const { data: nonSeedProps, error: propFetchErr } = await supabaseAdmin
      .from('properties')
      .select('id, title')
      .not('id', 'in', `(${SEED_PROPERTY_IDS.join(',')})`);

    if (!propFetchErr && nonSeedProps && nonSeedProps.length > 0) {
      console.log(`   Found ${nonSeedProps.length} non-seed properties to prune.`);
      const nonSeedIds = nonSeedProps.map((p) => p.id);
      
      // Clean dependent rooms/media first
      await supabaseAdmin.from('property_rooms').delete().in('property_id', nonSeedIds);
      await supabaseAdmin.from('property_media').delete().in('property_id', nonSeedIds);
      await supabaseAdmin.from('property_pricing').delete().in('property_id', nonSeedIds);
      
      const { error: delPropErr } = await supabaseAdmin.from('properties').delete().in('id', nonSeedIds);
      if (delPropErr) {
        console.log(`   [Notice] Could not delete custom properties: ${delPropErr.message}`);
      } else {
        console.log(`   ✓ Pruned ${nonSeedProps.length} test property records.`);
      }
    } else {
      console.log('   ✓ Only core master properties found. No test properties to prune.');
    }
  } catch (err: any) {
    console.log(`   [Notice] Properties pruning skipped: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 3. Purge Non-Core Auth Users & Profiles
  // ---------------------------------------------------------------------------
  console.log('\n👥 3. Auditing and cleaning user accounts...');
  const { data: authData, error: authListErr } = await supabaseAdmin.auth.admin.listUsers();
  if (authListErr) {
    console.error('❌ Failed to list Supabase auth users:', authListErr.message);
    process.exit(1);
  }

  const existingUsers = authData?.users || [];
  console.log(`   Total Supabase Auth Accounts Found: ${existingUsers.length}`);

  let deletedCount = 0;
  for (const u of existingUsers) {
    const email = (u.email || '').toLowerCase();
    if (!coreEmailSet.has(email)) {
      try {
        // Disconnect relations
        await supabaseAdmin.from('properties').update({ list_agent_key: null, created_by: null }).eq('list_agent_key', u.id);
        await supabaseAdmin.from('properties').update({ list_agent_key: null, created_by: null }).eq('created_by', u.id);
        await supabaseAdmin.from('profiles').delete().eq('id', u.id);

        const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(u.id);
        if (delAuthErr) {
          console.error(`   ❌ Failed to delete ${email}: ${delAuthErr.message}`);
        } else {
          console.log(`   ✓ Removed non-core user: ${email} (${u.id})`);
          deletedCount++;
        }
      } catch (err: any) {
        console.error(`   ❌ Error deleting ${email}: ${err.message}`);
      }
    }
  }
  console.log(`   ✓ Non-core accounts cleaned: ${deletedCount}`);

  // ---------------------------------------------------------------------------
  // 4. Provision & Standardize Core Users (Admin, Broker, Agent, Client)
  // ---------------------------------------------------------------------------
  console.log('\n✨ 4. Provisioning & Standardizing Core User Accounts...');

  const provisionedMap: Record<string, string> = {};

  for (const userSpec of CORE_USERS) {
    const existing = existingUsers.find(
      (u) => u.email?.toLowerCase() === userSpec.email.toLowerCase()
    );

    let userId: string;

    if (existing) {
      console.log(`   Updating existing ${userSpec.role.toUpperCase()} (${userSpec.email})...`);
      const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existing.id,
        {
          password: userSpec.password,
          email_confirm: true,
          user_metadata: {
            role: userSpec.role,
            full_name: userSpec.fullName,
            email_verified: true,
          },
        }
      );

      if (updateError) {
        console.error(`   ❌ Failed to update ${userSpec.email}:`, updateError.message);
        continue;
      }
      userId = updated.user.id;
      console.log(`   ✓ Standardized ${userSpec.role.toUpperCase()} account (ID: ${userId})`);
    } else {
      console.log(`   Creating new ${userSpec.role.toUpperCase()} (${userSpec.email})...`);
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userSpec.email,
        password: userSpec.password,
        email_confirm: true,
        user_metadata: {
          role: userSpec.role,
          full_name: userSpec.fullName,
          email_verified: true,
        },
      });

      if (createError) {
        console.error(`   ❌ Failed to create ${userSpec.email}:`, createError.message);
        continue;
      }
      userId = created.user.id;
      console.log(`   ✓ Created ${userSpec.role.toUpperCase()} account (ID: ${userId})`);
    }

    provisionedMap[userSpec.role] = userId;

    // Standardize public.profiles record
    try {
      const profilePayload: Record<string, any> = {
        id: userId,
        email: userSpec.email,
        full_name: userSpec.fullName,
        role: userSpec.role,
      };

      if (userSpec.role === 'agent') {
        profilePayload.verification_status = 'VERIFIED';
        profilePayload.membership_status = 'active';
        profilePayload.onboarding_status = 'complete';
        profilePayload.routing_availability = 'available';
        profilePayload.can_create_listings = true;
        profilePayload.prc_license_no = 'PRC-0099882';
        profilePayload.dhsud_accreditation_no = 'DHSUD-NCR-A-2026/001';
      }

      const { error: profErr } = await supabaseAdmin.from('profiles').upsert(profilePayload, { onConflict: 'id' });
      if (profErr) {
        console.log(`   [Notice] Profile sync: ${profErr.message}`);
      } else {
        console.log(`   ✓ public.profiles synchronized for ${userSpec.fullName} (${userSpec.email})`);
      }
    } catch (err: any) {
      console.log(`   [Notice] Profile upsert skipped: ${err.message}`);
    }

    // Validate login
    try {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: userSpec.email,
        password: userSpec.password,
      });

      if (signInErr || !signInData.session) {
        console.error(`   ❌ Login validation failed for ${userSpec.email}:`, signInErr?.message);
      } else {
        console.log(`   ✓ Login verified for ${userSpec.email} (Role: ${signInData.user.user_metadata?.role})`);
      }
    } catch (err: any) {
      console.error(`   ❌ Login test error for ${userSpec.email}:`, err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Link Master Properties to Core Agent & Broker
  // ---------------------------------------------------------------------------
  if (provisionedMap['agent'] && provisionedMap['broker']) {
    console.log('\n🔗 5. Binding master seed properties to core Agent & Broker...');
    try {
      await supabaseAdmin
        .from('properties')
        .update({
          list_agent_key: provisionedMap['agent'],
          created_by: provisionedMap['broker'],
        })
        .in('id', SEED_PROPERTY_IDS);

      console.log('   ✓ Master seed properties assigned to core Agent & Broker.');
    } catch (err: any) {
      console.log(`   [Notice] Property reassignment note: ${err.message}`);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 Database Cleanup & Core Provisioning Complete!');
  console.log('================================================================');
  console.log('Active Core Accounts:');
  CORE_USERS.forEach((u) => {
    console.log(` • [${u.role.toUpperCase()}] Name: "${u.fullName}" | Email: ${u.email} | Password: ${u.password}`);
  });
  console.log('================================================================\n');
}

if (process.argv[1]?.includes('clean-database')) {
  cleanDatabase().catch(console.error);
}
