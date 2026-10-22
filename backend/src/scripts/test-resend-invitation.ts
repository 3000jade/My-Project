import { InvitationService } from '../services/invitation.service';

async function testResend() {
  console.log('================================================================');
  console.log('   Human Shelter Realty | Test Resend Invitation Flow          ');
  console.log('================================================================\n');

  const targetEmail = process.argv[2] || 'mshisuke@gmail.com';
  console.log(` • Target Recipient: ${targetEmail}`);

  try {
    // 1. Check if an invitation already exists for this email
    const list = await InvitationService.listInvitations();
    let inv = list.find((i) => i.email.toLowerCase() === targetEmail.toLowerCase());

    if (!inv) {
      console.log(`Creating initial invitation for ${targetEmail}...`);
      inv = await InvitationService.createInvitation(
        {
          email: targetEmail,
          brokerAgency: 'Human Shelter Realty',
          message: 'Integration test invitation',
        },
        'b0000000-0000-0000-0000-000000000001'
      );
      console.log(`✅ Initial invitation created: ID ${inv.id}, Token: ${inv.token}`);
    } else {
      console.log(`Found existing invitation: ID ${inv.id}, Status: ${inv.status}, Expires: ${inv.expires_at}`);
    }

    // 2. Test Resending the invitation
    console.log(`\nTriggering InvitationService.resendInvitation("${inv.id}")...`);
    const resent = await InvitationService.resendInvitation(inv.id);

    console.log('\n================================================================');
    console.log('✅ Resend Invitation Flow Completed Successfully!');
    console.log(` • Invitation ID : ${resent.id}`);
    console.log(` • Recipient     : ${resent.email}`);
    console.log(` • Status        : ${resent.status}`);
    console.log(` • New Expiry    : ${resent.expires_at} (72 hours from now)`);
    console.log(` • Invite URL    : ${InvitationService.getInviteUrl(resent.token || '')}`);
    console.log('================================================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Error testing resend invitation:', err.message);
    process.exit(1);
  }
}

testResend();
