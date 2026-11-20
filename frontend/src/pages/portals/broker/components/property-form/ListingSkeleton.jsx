import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shimmer Skeleton Cards matching the 8/4 Bento Create Listing layout.
 */
export default function ListingSkeleton() {
  return (
    <div
      className="min-h-screen bg-[#F8FAFC] p-4 md:p-8"
      aria-busy="true"
      aria-label="Loading listing workspace"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header + Stepper Skeleton */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="h-11 w-36 rounded-lg" />
          </div>

          <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center gap-3 p-2">
                  <Skeleton className="size-9 rounded-full shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 8/4 Bento Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-11 w-full rounded-lg" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
                <Skeleton className="h-11 w-full rounded-lg" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Skeleton className="h-11 w-full rounded-lg" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-11 w-full rounded-lg" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
                <Skeleton className="h-24 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
              <Skeleton className="h-52 w-full rounded-none" />
              <CardContent className="p-5 flex flex-col gap-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2E8F0]">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
