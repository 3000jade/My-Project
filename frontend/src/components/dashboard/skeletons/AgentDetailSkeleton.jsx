import React from 'react';
import MetricCardsSkeleton from './MetricCardsSkeleton';
import TableSkeleton from './TableSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

export function AgentDetailSkeleton({ className = '' }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading agent credentials dossier..."
      className={`space-y-8 font-sans max-w-7xl mx-auto py-2 ${className}`}
    >
      {/* 1. Header & Agent Profile Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Skeleton className="size-20 sm:size-24 rounded-full border-4 border-slate-100 dark:border-slate-800" />
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-7 w-48 sm:w-64 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-40 rounded-md" />
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* 2. 4-KPI Metric Strip */}
      <MetricCardsSkeleton />

      {/* 3. Tabbed Tables Area */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Skeleton className="h-8 w-36 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
        <TableSkeleton rows={4} />
      </div>
    </div>
  );
}

export default AgentDetailSkeleton;
