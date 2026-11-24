import React from 'react';
import { useDashboardHeaderTitle } from './DashboardLayout';

export default function PageHeader({
  title,
  subtitle,
  showSubtitle = false,
  badge,
  actions,
  className = ""
}) {
  useDashboardHeaderTitle(title);

  const visibleSubtitle = showSubtitle && subtitle ? subtitle : null;
  if (!visibleSubtitle && !badge && !actions) {
    return null;
  }

  return (
    <div className={`mb-4 min-w-0 max-w-full ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        {(badge || visibleSubtitle) && (
          <div className="min-w-0 flex flex-col gap-1">
            {badge && <div>{badge}</div>}
            {visibleSubtitle && (
              <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl min-w-0 break-words">
                {visibleSubtitle}
              </p>
            )}
          </div>
        )}

        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto min-w-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
