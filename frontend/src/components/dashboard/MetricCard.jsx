import React, { isValidElement } from 'react';
import { cn } from '@/utils/cn';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
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
        "bg-white rounded-xl p-5 border border-[#E5EBEB] transition-all duration-200 shadow-2xs hover:border-[#D8DFDF] hover:shadow-xs",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500">
            {title}
          </p>
          <p className="text-2xl font-mono font-bold text-[#0D4446] tracking-tight">
            {value}
          </p>
        </div>

        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-[#0D4446]/5 text-[#0D4446] flex items-center justify-center shrink-0 border border-[#0D4446]/10">
            {renderIcon()}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-[#E5EBEB] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{subtitle}</span>
          {trend && (
            <span className={cn("font-medium", trend.startsWith('+') ? "text-emerald-800" : "text-slate-500")}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
