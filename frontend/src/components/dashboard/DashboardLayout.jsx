import React, { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import { DashboardThemeProvider, useDashboardDensity } from '../../context/DashboardThemeContext';
import { DashboardPageSkeleton } from './skeletons';

function DashboardLayoutContent({ role, title }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { density } = useDashboardDensity();

  return (
    <div
      data-testid="broker-dashboard-container"
      data-dashboard-density={density}
      className="flex min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans antialiased transition-[font-size] duration-150"
    >
      {/* Sidebar Navigation */}
      <DashboardSidebar
        role={role}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          role={role}
          title={title}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8">
          <Suspense fallback={<DashboardPageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ role = 'broker', title = 'Property Listings' }) {
  return (
    <DashboardThemeProvider role={role}>
      <DashboardLayoutContent role={role} title={title} />
    </DashboardThemeProvider>
  );
}
