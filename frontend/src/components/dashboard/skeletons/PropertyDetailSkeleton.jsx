import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function PropertyDetailSkeleton({ className = '' }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading property listing dossier..."
      className={`space-y-8 font-sans max-w-7xl mx-auto py-2 ${className}`}
    >
      {/* 1. Header with Breadcrumbs & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-4 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
          <Skeleton className="h-8 w-72 sm:w-96 rounded-lg" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* 2. Media Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-2xl overflow-hidden">
        <div className="md:col-span-2 md:row-span-2">
          <Skeleton className="h-72 md:h-96 w-full rounded-xl" />
        </div>
        <div className="hidden md:block">
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
        <div className="hidden md:block">
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
        <div className="hidden md:block">
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
        <div className="hidden md:block">
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      </div>

      {/* 3. Main 2-Column Split: Specs & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Key Attributes Strip */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-6 w-24 rounded-md" />
              </div>
            ))}
          </div>

          {/* Description & Specs Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="h-4 w-4/6 rounded-md" />
          </div>

          {/* Map Location Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
        </div>

        {/* Right Sidebar: Pricing & Agent Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-9 w-48 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <Skeleton className="h-4 w-28 rounded-md" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetailSkeleton;
