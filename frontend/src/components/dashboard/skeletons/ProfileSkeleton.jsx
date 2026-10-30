import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton({ className = '' }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading profile credentials..."
      className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${className}`}
    >
      {/* Left Column: Avatar & Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col items-center text-center space-y-4">
        <Skeleton className="size-28 rounded-full border-4 border-slate-100 dark:border-slate-800" />
        <div className="space-y-1.5 w-full flex flex-col items-center">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-3.5 w-32 rounded-md" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />

        <div className="w-full pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-14 rounded-md" />
            <Skeleton className="h-4 w-40 rounded-md" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-20 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-24 rounded-md" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
        </div>

        <div className="w-full pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>

      {/* Right Column: Appearance & Accreditations */}
      <div className="md:col-span-2 space-y-6">
        {/* Appearance Card Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-3 w-64 rounded-md" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>

        {/* Credentials Card Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <Skeleton className="h-5 w-60 rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default ProfileSkeleton;
