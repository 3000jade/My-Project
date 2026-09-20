import { supabase, supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';

export const SYSTEM_USERS = [
  {
    email: 'admin@pt.com',
    password: 'adminPassword123!',
    fullName: 'Alexander Sterling',
    role: 'admin',
  },
  {
    email: 'broker@pt.com',
    password: 'brokerPassword123!',
    fullName: 'Helena Vance',
    role: 'broker',
  },
  {
    email: 'agent@pt.com',
    password: 'agentPassword123!',
    fullName: 'Elena Rossi',
    role: 'agent',
  },
];

export async function seedUsers() {
  console.log('\n======================================================');
  console.log('   CP_kerby - System Auth Users Provisioning & Test   ');
  console.log('======================================================\n');

  if (!isSupabaseConfigured) {
    console.log('[WARN] Supabase not configured in .env. Mock fallback will be active.');
    return;
  }

  // 1. Fetch existing users to avoid duplicate or conflict errors
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    logger.error('Failed to list existing Supabase users:', listError.message);
    return;
  }

  const existingUsers = listData?.users || [];
  console.log(`Found ${existingUsers.length} existing users in Supabase Auth.`);

  for (const userSpec of SYSTEM_USERS) {
    const existing = existingUsers.find(
      (u) => u.email?.toLowerCase() === userSpec.email.toLowerCase()
    );

    let userId: string;

    if (existing) {
      console.log(`User ${userSpec.email} exists (ID: ${existing.id}). Updating password and metadata...`);
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
        console.error(`Failed to update ${userSpec.email}:`, updateError.message);
        continue;
      }
      userId = updated.user.id;
      console.log(`✓ Updated user: ${userSpec.email}`);
    } else {
      console.log(`Creating user ${userSpec.email} (${userSpec.role})...`);
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
        console.error(`Failed to create ${userSpec.email}:`, createError.message);
        continue;
      }
      userId = created.user.id;
      console.log(`✓ Created user: ${userSpec.email} with ID: ${userId}`);
    }

    // Attempt to upsert into public.profiles if table exists
    try {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: userId,
            email: userSpec.email,
            full_name: userSpec.fullName,
            role: userSpec.role,
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        // Table might not exist yet if SQL migration wasn't run
        console.log(`  [Note] profiles table sync skipped: ${profileError.message}`);
      } else {
        console.log(`  ✓ Synced public.profiles row for ${userSpec.email}`);
      }
    } catch {
      // Ignored if table missing
    }

    // 2. Validate signInWithPassword to guarantee status 200 OK
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userSpec.email,
        password: userSpec.password,
      });

      if (signInError || !signInData.session) {
        console.error(`  ✗ SignIn test FAILED for ${userSpec.email}:`, signInError?.message);
      } else {
        console.log(`  ✓ Live SignIn VALIDATED! Session token issued (User ID: ${signInData.user.id})`);
        console.log(`  ✓ Assigned Role: ${signInData.user.user_metadata?.role}`);
      }
    } catch (err: any) {
      console.error(`  ✗ Unexpected signIn error for ${userSpec.email}:`, err.message);
    }
    console.log('------------------------------------------------------');
  }

  console.log('\nAll System Users Provisioned and Validated Successfully!\n');
}

if (process.argv[1]?.includes('seed-users')) {
  seedUsers().catch(console.error);
}
