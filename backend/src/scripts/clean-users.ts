import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';

async function main() {
  console.log('================================================================');
  console.log('   Human Shelter Realty | User Accounts Cleanup Tool            ');
  console.log('================================================================\n');

  if (!isSupabaseConfigured) {
    console.error('❌ Supabase is not configured. Aborting.');
    process.exit(1);
  }

  // 1. Fetch Supabase Auth users
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
  if (authErr) {
    console.error('❌ Failed to fetch users:', authErr.message);
    process.exit(1);
  }

  const users = authData?.users || [];
  console.log(`Total Supabase Auth Accounts Found: ${users.length}\n`);

  // 2. Fetch Profiles
  const { data: profiles, error: profErr } = await supabaseAdmin.from('profiles').select('*');
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const brokersToKeep: any[] = [];
  const usersToDelete: any[] = [];

  for (const u of users) {
    const profile = profileMap.get(u.id);
    const role = (u.user_metadata?.role || profile?.role || '').toLowerCase();
    const email = (u.email || '').toLowerCase();

    // Check if user is a broker or admin
    // Note: Do not match '@luxurybrokerage.ph' domain as those are agent candidate test accounts
    const isBroker = role === 'broker' || role === 'admin' || email === 'broker@pt.com';

    if (isBroker) {
      brokersToKeep.push({
        id: u.id,
        email: u.email,
        role: role || 'broker',
        fullName: u.user_metadata?.full_name || profile?.full_name || 'Broker',
      });
    } else {
      usersToDelete.push({
        id: u.id,
        email: u.email,
        role: role || 'user',
        fullName: u.user_metadata?.full_name || profile?.full_name || 'N/A',
      });
    }
  }

  console.log('🛡️  ACCOUNTS TO PRESERVE (BROKERS / ADMINS):');
  if (brokersToKeep.length === 0) {
    console.log(' (None detected)');
  } else {
    brokersToKeep.forEach((b) => {
      console.log(` • [PRESERVE] ${b.email} | Role: ${b.role} | ID: ${b.id}`);
    });
  }

  console.log('\n🗑️  ACCOUNTS TO REMOVE (ALL OTHER ROLES):');
  if (usersToDelete.length === 0) {
    console.log(' (No non-broker users found to clean)');
  } else {
    usersToDelete.forEach((u) => {
      console.log(` • [DELETE]   ${u.email} | Role: ${u.role} | ID: ${u.id}`);
    });
  }

  const executeClean = process.argv.includes('--execute') || process.argv.includes('--confirm');

  if (!executeClean) {
    console.log('\n----------------------------------------------------------------');
    console.log('ℹ️  DRY RUN ONLY. No users were deleted.');
    console.log('To execute this cleanup, run:');
    console.log(' 👉 npx tsx src/scripts/clean-users.ts --execute');
    console.log('================================================================\n');
    return;
  }

  console.log('\n----------------------------------------------------------------');
  console.log('Executing User Cleanup...');

  let deletedCount = 0;
  for (const u of usersToDelete) {
    try {
      // 1. Clear properties referencing this user
      await supabaseAdmin.from('properties').update({ list_agent_key: null, created_by: null }).eq('list_agent_key', u.id);
      await supabaseAdmin.from('properties').update({ list_agent_key: null, created_by: null }).eq('created_by', u.id);

      // 2. Clear notifications, inquiries, and appointments referencing this user
      await supabaseAdmin.from('notifications').delete().eq('user_id', u.id);
      await supabaseAdmin.from('inquiries').delete().eq('assigned_agent_id', u.id);
      await supabaseAdmin.from('appointments').update({ agent_id: null }).eq('agent_id', u.id);
      await supabaseAdmin.from('appointments').delete().eq('agent_id', u.id);

      // 3. Clear invitations referencing this user
      await supabaseAdmin.from('agent_invitations').delete().eq('email', u.email);
      await supabaseAdmin.from('agent_invitations').update({ invited_by: null }).eq('invited_by', u.id);

      // 4. Clear audit links on ALL profiles that might point to this user
      await supabaseAdmin.from('profiles').update({ verified_by: null }).eq('verified_by', u.id);
      await supabaseAdmin.from('profiles').update({ suspended_by: null }).eq('suspended_by', u.id);

      // 5. Delete this user's profile
      await supabaseAdmin.from('profiles').delete().eq('id', u.id);

      // 6. Delete from Supabase Auth
      const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(u.id);
      if (delAuthErr) {
        console.error(` ❌ Failed to delete ${u.email}: ${delAuthErr.message}`);
      } else {
        console.log(` ✅ Deleted: ${u.email} (${u.id})`);
        deletedCount++;
      }
    } catch (err: any) {
      console.error(` ❌ Error deleting ${u.email}: ${err.message}`);
    }
  }

  console.log('================================================================');
  console.log(`Cleanup Complete! ${deletedCount} user(s) removed.`);
  console.log(`Preserved ${brokersToKeep.length} broker account(s).`);
  console.log('================================================================\n');
}

main().catch(console.error);
