import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function CardGridSkeleton({ count = 6, className = '' }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading cards..."
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-4"
        >
          {/* Card Media Header */}
          <div className="relative">
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="absolute top-3 right-3">
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="absolute bottom-3 left-3">
              <Skeleton className="h-6 w-28 rounded-md bg-slate-900/40" />
            </div>
          </div>

          {/* Card Content Body */}
          <div className="p-5 pt-0 space-y-3">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-3.5 w-1/2 rounded-md" />
            </div>

            {/* Spec Chips (Bed, Bath, Area) */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>

            {/* Footer / Agent & Action */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CardGridSkeleton;
