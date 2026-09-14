import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import SandboxHeader from './SandboxHeader';

export default function SandboxLayout() {
  return (
    <div className="min-h-screen bg-[#070b0b] text-white flex flex-col selection:bg-emerald-500 selection:text-black">
      <SandboxHeader />
      <main className="flex-1 w-full pt-[72px]">
        <Suspense
          fallback={
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono uppercase tracking-widest text-emerald-400/80">Loading Sandbox Module...</p>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
