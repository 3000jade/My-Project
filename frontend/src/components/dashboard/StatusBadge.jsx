import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  const statusStyles = {
    // Property Statuses
    AVAILABLE: "bg-[#266F71]/15 text-[#266F71] border-[#266F71]/30",
    RESERVED: "bg-[#FB8E5D]/15 text-[#D96B37] border-[#FB8E5D]/30",
    SOLD: "bg-gray-200 text-gray-700 border-gray-300",
    INACTIVE: "bg-gray-100 text-gray-500 border-gray-200",

    // Inquiry Statuses
    NEW: "bg-[#FB8E5D]/15 text-[#D96B37] border-[#FB8E5D]/30 font-bold",
    ASSIGNED: "bg-[#266F71]/15 text-[#266F71] border-[#266F71]/30",
    RESOLVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
    REOPENED: "bg-amber-50 text-amber-800 border-amber-300",

    // Appointment Statuses
    REQUESTED: "bg-[#FB8E5D]/15 text-[#D96B37] border-[#FB8E5D]/30",
    CONFIRMED: "bg-[#266F71]/15 text-[#266F71] border-[#266F71]/30",
    COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",

    // Verification Statuses
    PENDING: "bg-[#FB8E5D]/15 text-[#D96B37] border-[#FB8E5D]/30",
    VERIFIED: "bg-[#266F71]/15 text-[#266F71] border-[#266F71]/30",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
    SUSPENDED: "bg-gray-200 text-gray-700 border-gray-300",

    // Publication Statuses
    PUBLISHED: "bg-[#266F71]/15 text-[#266F71] border-[#266F71]/30",
    DRAFT: "bg-gray-100 text-gray-600 border-gray-300"
  };

  const style = statusStyles[normalized] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border ${style} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status}
    </span>
  );
}
