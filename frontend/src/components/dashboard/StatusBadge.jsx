import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  const statusStyles = {
    // Active / Available / Success (Spruce Teal #0F766E tokens)
    AVAILABLE: 'bg-teal-50 text-teal-700 border-teal-200',
    ACTIVE: 'bg-teal-50 text-teal-700 border-teal-200',
    PUBLISHED: 'bg-teal-50 text-teal-700 border-teal-200',
    ASSIGNED: 'bg-teal-50 text-teal-700 border-teal-200',
    CONFIRMED: 'bg-teal-50 text-teal-700 border-teal-200',
    VERIFIED: 'bg-teal-50 text-teal-700 border-teal-200',
    ACCEPTED: 'bg-teal-50 text-teal-700 border-teal-200 font-bold',
    RESOLVED: 'bg-teal-50 text-teal-700 border-teal-200',
    COMPLETED: 'bg-teal-50 text-teal-700 border-teal-200',

    // Pending / In-progress / Attention (Amber #F59E0B tokens)
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    RESERVED: 'bg-amber-50 text-amber-700 border-amber-200',
    NEW: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
    REOPENED: 'bg-amber-50 text-amber-700 border-amber-200',
    REQUESTED: 'bg-amber-50 text-amber-700 border-amber-200',
    'ACTIVE UNDER CONTRACT': 'bg-amber-50 text-amber-700 border-amber-200',
    ACTIVE_UNDER_CONTRACT: 'bg-amber-50 text-amber-700 border-amber-200',
    'PENDING APPROVAL': 'bg-amber-50 text-amber-700 border-amber-200',
    PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
    'PENDING CONFIRMATION': 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
    PENDING_CONFIRMATION: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',

    // Terminal / Archive / Neutral (Slate Neutral #334155 tokens)
    SOLD: 'bg-slate-100 text-slate-700 border-slate-300',
    CLOSED: 'bg-slate-100 text-slate-700 border-slate-300',
    SUSPENDED: 'bg-slate-100 text-slate-700 border-slate-300',
    EXPIRED: 'bg-slate-100 text-slate-600 border-slate-200',

    // Inactive / Draft (Slate Muted tokens)
    DRAFT: 'bg-slate-50 text-slate-600 border-slate-200',
    INACTIVE: 'bg-slate-50 text-slate-600 border-slate-200',

    // Alert / Cancelled / Rejected (Coral / Alert #FF6B6B tokens)
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
    CANCELED: 'bg-rose-50 text-rose-700 border-rose-200',
    'ACTION REQUIRED': 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
    ACTION_REQUIRED: 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
  };

  const style = statusStyles[normalized] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border ${style} ${className}`.trim()}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status}
    </span>
  );
}
