import React from 'react';
import UnderDevelopmentPage from '../../public/UnderDevelopmentPage';

export default function AgentDashboard() {
  return (
    <UnderDevelopmentPage
      variant="portal"
      title="Agent Dashboard Under Development"
      badgeLabel="Agent Portal • Under Development"
      description="We are rebuilding the Agent Dashboard with updated workspace tools. Your listings, inquiries, and profile are ready to use in the meantime."
      homePath="/agent/properties"
      primaryActionLabel="View Properties"
    />
  );
}
