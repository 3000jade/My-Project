import React from 'react';
import { Users, BadgeCheck, ClipboardList, MailPlus } from 'lucide-react';
import KpiCard from '../ui/cards/KpiCard';

/**
 * AgentTelemetryStrip
 * 4-metric KPI summary strip for the Broker Agents console.
 */
export default function AgentTelemetryStrip({
  totalAgents,
  verifiedCount,
  pendingCount,
  activeInvitationsCount,
}) {
  const activePct = totalAgents > 0 ? Math.round((verifiedCount / totalAgents) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        data-testid="broker-card"
        variant="trend"
        title="Total Agents"
        value={totalAgents}
        icon={Users}
        trend="20%"
        trendDirection="up"
        footerText="vs last month"
      />
      <KpiCard
        data-testid="broker-card"
        variant="trend"
        title="Verified Agents"
        value={verifiedCount}
        icon={BadgeCheck}
        footerText={`${activePct}% Active roster`}
      />
      <KpiCard
        data-testid="broker-card"
        variant="trend"
        title="Pending Review"
        value={pendingCount}
        icon={ClipboardList}
        footerText={pendingCount > 0 ? `${pendingCount} awaiting approval` : 'All reviewed'}
      />
      <KpiCard
        data-testid="broker-card"
        variant="trend"
        title="Active Invitations"
        value={activeInvitationsCount}
        icon={MailPlus}
        footerText="Pending onboarding"
      />
    </div>
  );
}
