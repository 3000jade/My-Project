import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ListSkeleton({ count = 5, className = '' }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading list items..."
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 space-y-4 ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="pt-4 first:pt-0 flex items-start gap-4">
          <Skeleton className="size-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-48 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
            <Skeleton className="h-3.5 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ListSkeleton;
