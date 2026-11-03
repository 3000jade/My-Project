import React from 'react';
import { Users, BadgeCheck, ClipboardList, MailPlus, ArrowUpRight } from 'lucide-react';

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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Card 1: Total Agents */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-all">
        <div className="w-11 h-11 rounded-xl bg-teal-50/70 border border-teal-100/80 flex items-center justify-center text-[#0F766E] shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#64748B] truncate">
            <span>Total Agents</span>
            <span className="sr-only">Total Consultants</span>
          </p>
          <p className="text-2xl font-bold text-[#1E293B] mt-0.5 tracking-tight">{totalAgents}</p>
          <p className="text-[11px] font-medium text-[#0F766E] mt-0.5 flex items-center gap-0.5 truncate">
            <ArrowUpRight className="w-3 h-3 shrink-0" />
            <span>20% vs last month</span>
          </p>
        </div>
      </div>

      {/* Card 2: Verified Agents */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-all">
        <div className="w-11 h-11 rounded-xl bg-teal-50/70 border border-teal-100/80 flex items-center justify-center text-[#0F766E] shrink-0">
          <BadgeCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#64748B] truncate">
            <span>Verified Agents</span>
            <span className="sr-only">Verified Active</span>
          </p>
          <p className="text-2xl font-bold text-[#1E293B] mt-0.5 tracking-tight">{verifiedCount}</p>
          <p className="text-[11px] font-medium text-[#0F766E] mt-0.5 truncate">
            {totalAgents > 0 ? Math.round((verifiedCount / totalAgents) * 100) : 0}% Active roster
          </p>
        </div>
      </div>

      {/* Card 3: Pending Review */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-all">
        <div className="w-11 h-11 rounded-xl bg-teal-50/70 border border-teal-100/80 flex items-center justify-center text-[#0F766E] shrink-0">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#64748B] truncate">
            Pending Review
          </p>
          <p className="text-2xl font-bold text-[#1E293B] mt-0.5 tracking-tight">{pendingCount}</p>
          <p className="text-[11px] font-medium text-[#64748B] mt-0.5 truncate">
            {pendingCount > 0 ? `${pendingCount} awaiting approval` : 'All reviewed'}
          </p>
        </div>
      </div>

      {/* Card 4: Active Invitations */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-all">
        <div className="w-11 h-11 rounded-xl bg-teal-50/70 border border-teal-100/80 flex items-center justify-center text-[#0F766E] shrink-0">
          <MailPlus className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#64748B] truncate">
            Active Invitations
          </p>
          <p className="text-2xl font-bold text-[#1E293B] mt-0.5 tracking-tight">{activeInvitationsCount}</p>
          <p className="text-[11px] font-medium text-[#64748B] mt-0.5 truncate">
            Pending onboarding
          </p>
        </div>
      </div>
    </div>
  );
}
