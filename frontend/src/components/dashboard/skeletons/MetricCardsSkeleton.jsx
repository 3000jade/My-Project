import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function MetricCardsSkeleton({ count = 4, className = '' }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading metrics..."
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="size-9 rounded-lg" />
          </div>
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default MetricCardsSkeleton;
