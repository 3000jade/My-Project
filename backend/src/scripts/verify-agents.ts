import { AgentService } from '../services/agent.service';
import { InvitationService } from '../services/invitation.service';

async function main() {
  console.log('================================================================');
  console.log('   Human Shelter Realty | Agent Management Verification         ');
  console.log('================================================================\n');

  const agents = await AgentService.listAgents();
  console.log(` • Live Database Agents Count : ${agents.length}`);
  if (agents.length === 0) {
    console.log('   (0 agents found - empty state active)');
  } else {
    agents.forEach((a) => console.log(`   - ${a.name} (${a.email}) [Status: ${a.verification_status}]`));
  }

  const invitations = await InvitationService.listInvitations();
  console.log(`\n • Live Database Invitations Count : ${invitations.length}`);
  if (invitations.length === 0) {
    console.log('   (0 invitations found - empty state active)');
  } else {
    invitations.forEach((i) => console.log(`   - ${i.email} [Status: ${i.status}]`));
  }

  console.log('\n================================================================');
  process.exit(0);
}

main().catch(console.error);
