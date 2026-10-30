import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton({ rows = 5, hasToolbar = true, className = '' }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading data table..."
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden ${className}`}
    >
      {/* Search & Filter Toolbar */}
      {hasToolbar && (
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-64 sm:w-72 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl hidden md:block" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="size-10 rounded-xl" />
          </div>
        </div>
      )}

      {/* Table Header Row */}
      <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 grid grid-cols-12 gap-4 items-center">
        <Skeleton className="col-span-5 sm:col-span-4 h-4 w-28 rounded-md" />
        <Skeleton className="col-span-3 sm:col-span-3 h-4 w-20 rounded-md hidden sm:block" />
        <Skeleton className="col-span-3 sm:col-span-2 h-4 w-16 rounded-md" />
        <Skeleton className="col-span-4 sm:col-span-2 h-4 w-20 rounded-md" />
        <Skeleton className="col-span-1 h-4 w-8 rounded-md ml-auto" />
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-4 grid grid-cols-12 gap-4 items-center">
            {/* Primary Column with Avatar/Thumbnail */}
            <div className="col-span-5 sm:col-span-4 flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl shrink-0" />
              <div className="space-y-1.5 min-w-0 flex-1">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>

            {/* Column 2 */}
            <div className="col-span-3 sm:col-span-3 hidden sm:block space-y-1">
              <Skeleton className="h-3.5 w-28 rounded-md" />
              <Skeleton className="h-2.5 w-16 rounded-md" />
            </div>

            {/* Column 3 (Metric / Price) */}
            <div className="col-span-3 sm:col-span-2 space-y-1">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-2.5 w-12 rounded-md" />
            </div>

            {/* Column 4 (Status Badge) */}
            <div className="col-span-4 sm:col-span-2">
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Actions */}
            <div className="col-span-1 flex justify-end">
              <Skeleton className="size-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Pagination Footer */}
      <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <Skeleton className="h-4 w-36 rounded-md" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default TableSkeleton;
