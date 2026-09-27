import React from 'react';
import { cn } from '@/utils/cn';

const STATUS_CONFIGS = {
  Available: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Available'
  },
  Active: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Active'
  },
  'Pending Approval': {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-300',
    dot: 'bg-amber-500 animate-pulse',
    label: 'Needs Approval'
  },
  'Active Under Contract': {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    label: 'Under Contract'
  },
  'Under Contract': {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    label: 'Under Contract'
  },
  Pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'Pending'
  },
  Reserved: {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    label: 'Reserved'
  },
  Closed: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: 'Closed'
  },
  Sold: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: 'Sold'
  },
  Draft: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: 'Draft'
  },
  Canceled: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-400',
    label: 'Canceled'
  },
  Expired: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-400',
    label: 'Expired'
  }
};

export function StatusBadge({ status = 'Active', className }) {
  const normalizedKey = String(status || '').trim().toLowerCase();
  const matchedKey = Object.keys(STATUS_CONFIGS).find(
    k => k.toLowerCase() === normalizedKey
  );
  const config = STATUS_CONFIGS[matchedKey] || STATUS_CONFIGS.Active;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border shrink-0",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      <span>{config.label}</span>
    </span>
  );
}

export default StatusBadge;
