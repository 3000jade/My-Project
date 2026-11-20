import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton({ className = '' }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading profile studio..."
      className={`grid grid-cols-1 lg:grid-cols-5 gap-6 items-start ${className}`}
    >
      {/* Left 60%: Editor Skeleton */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        <div className="bg-surface rounded-xl border border-outline p-6 shadow-xs flex flex-col gap-5">
          <div className="flex flex-col gap-2 pb-4 border-b border-outline">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>

      {/* Right 40%: Live Card Preview Skeleton */}
      <div className="lg:col-span-2 bg-surface rounded-xl border border-outline p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-4 pb-4 border-b border-outline">
          <Skeleton className="size-16 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-32 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default ProfileSkeleton;
