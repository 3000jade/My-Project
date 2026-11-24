import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import { DashboardThemeProvider, useDashboardDensity } from '../../context/DashboardThemeContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardPageSkeleton } from './skeletons';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

function DashboardLayoutContent({ role, title }) {
  const { density } = useDashboardDensity();
  const { toggleSidebar } = useSidebar();

  return (
    <div
      data-testid="broker-dashboard-container"
      data-dashboard-density={density}
      className="flex min-h-screen w-full bg-[#F8FAFC] text-[#1E293B] font-sans antialiased transition-[font-size] duration-150"
    >
      {/* Smart Deep Forest Teal Sidebar Navigation */}
      <DashboardSidebar role={role} />

      {/* Main Content Area */}
      <SidebarInset className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <DashboardHeader
          role={role}
          title={title}
          onMenuClick={toggleSidebar}
        />

        <main className="flex-1 p-4 sm:p-6 w-full space-y-4 sm:space-y-6">
          <Suspense fallback={<DashboardPageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </SidebarInset>
    </div>
  );
}

export default function DashboardLayout({ role = 'broker', title = 'Property Listings' }) {
  const { user } = useAuth();
  const effectiveRole = user?.role === 'admin' ? 'admin' : role;

  return (
    <DashboardThemeProvider role={effectiveRole}>
      <TooltipProvider>
        <SidebarProvider>
          <DashboardLayoutContent role={effectiveRole} title={title} />
        </SidebarProvider>
      </TooltipProvider>
    </DashboardThemeProvider>
  );
}
