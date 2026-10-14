import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

export default function DashboardLayout({ role = 'broker', title = 'Property Listings' }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans antialiased">
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
