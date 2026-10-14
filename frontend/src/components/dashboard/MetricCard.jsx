import React, { isValidElement } from 'react';
import { cn } from '@/utils/cn';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent,
  onClick,
  className = ""
}) {
  const renderIcon = () => {
    if (!Icon) return null;
    if (isValidElement(Icon)) return Icon;
    if (typeof Icon === 'string') {
      return <span className="material-symbols-outlined text-[18px]">{Icon}</span>;
    }
    const IconComponent = Icon;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg p-5 sm:p-6 border border-[#E2E8F0] transition-all duration-200 shadow-xs hover:border-slate-300",
        accent && "border-teal-300 ring-1 ring-teal-100",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#64748B]">
            {title}
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-[#1E293B] tracking-tight">
            {value}
          </p>
        </div>

        {Icon && (
          <div className={cn(
            "w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-colors",
            accent 
              ? "bg-[#0F766E] text-white" 
              : "bg-teal-50 text-[#0F766E] border border-teal-100"
          )}>
            {renderIcon()}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs sm:text-sm text-[#64748B]">
          <span>{subtitle}</span>
          {trend && (
            <span className={cn("font-medium", trend.startsWith('+') ? "text-emerald-600 font-semibold" : "text-[#64748B]")}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
