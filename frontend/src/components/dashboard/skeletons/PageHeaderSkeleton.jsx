import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function PageHeaderSkeleton({ hasSubtitle = true, hasActions = true, className = '' }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading page header..."
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800 ${className}`}
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 rounded-md" />
        {hasSubtitle && <Skeleton className="h-4 w-80 sm:w-96 rounded-md" />}
      </div>
      {hasActions && (
        <div className="flex items-center gap-2.5 shrink-0">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      )}
    </div>
  );
}

export default PageHeaderSkeleton;
