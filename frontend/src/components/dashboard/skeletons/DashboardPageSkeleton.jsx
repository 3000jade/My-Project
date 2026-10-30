import React from 'react';
import PageHeaderSkeleton from './PageHeaderSkeleton';
import MetricCardsSkeleton from './MetricCardsSkeleton';
import TableSkeleton from './TableSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardPageSkeleton({ className = '' }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading broker portal page..."
      className={`space-y-6 sm:space-y-8 font-sans ${className}`}
    >
      {/* 1. Header Skeleton */}
      <PageHeaderSkeleton />

      {/* 2. 4-KPI Metric Strip Skeleton */}
      <MetricCardsSkeleton />

      {/* 3. Main Workspace Area: Table & Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2">
          <TableSkeleton rows={5} />
        </div>
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="size-5 rounded-md" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-3/4 rounded-md" />
                    <Skeleton className="h-2.5 w-1/2 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPageSkeleton;
