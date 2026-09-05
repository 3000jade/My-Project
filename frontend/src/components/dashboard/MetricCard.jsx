import React from 'react';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accent = false,
  onClick,
  className = ""
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border transition-all duration-300 shadow-sm ${
        accent
          ? "border-[#FB8E5D]/40 bg-gradient-to-br from-white to-[#FB8E5D]/5"
          : "border-gray-200/80 hover:border-[#266F71]/40 hover:shadow-md"
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans">
            {title}
          </p>
          <p className="text-2xl lg:text-3xl font-display font-bold text-[#174849]">
            {value}
          </p>
        </div>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            accent ? "bg-[#FB8E5D]/15 text-[#FB8E5D]" : "bg-[#266F71]/10 text-[#266F71]"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
      </div>
      {subtitle && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-xs text-gray-500 font-sans">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
