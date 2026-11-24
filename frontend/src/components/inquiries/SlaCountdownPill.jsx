import React from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const SLA_MINUTES = 30;

export default function SlaCountdownPill({
  createdAt,
  operationalStatus,
  businessStatus,
  firstRespondedAt,
}) {
  if (businessStatus === 'inactive') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-[#64748B] border border-[#E2E8F0]">
        <CheckCircle2 className="w-3 h-3" />
        <span>Closed</span>
      </span>
    );
  }

  if (firstRespondedAt || operationalStatus === 'awaiting_client') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        <span>SLA Met</span>
      </span>
    );
  }

  const parsedMs = createdAt ? Date.parse(createdAt) : NaN;
  const elapsedMinutes = Number.isFinite(parsedMs)
    ? Math.max(0, Math.floor((Date.now() - parsedMs) / 60000))
    : 0;
  const remaining = SLA_MINUTES - elapsedMinutes;
  const isOverdue = operationalStatus === 'overdue' || (Number.isFinite(parsedMs) && remaining <= 0);

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6B6B]/20 text-[#1E293B] border border-[#FF6B6B]">
        <AlertTriangle className="w-3 h-3 text-rose-600" />
        <span>SLA Overdue</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/30">
      <Clock className="w-3 h-3" />
      <span>{Number.isFinite(parsedMs) ? `${remaining}m left` : '30m SLA'}</span>
    </span>
  );
}
