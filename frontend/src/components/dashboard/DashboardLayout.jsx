import React, { Suspense, createContext, useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import { DashboardThemeProvider, useDashboardDensity } from '../../context/DashboardThemeContext';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { DashboardPageSkeleton } from './skeletons';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export const DashboardTitleContext = createContext({
  pageTitle: null,
  setPageTitle: () => {},
});

export function useDashboardHeaderTitle(title) {
  const { setPageTitle } = useContext(DashboardTitleContext);
  React.useEffect(() => {
    if (!title) return;
    setPageTitle(title);
    return () => setPageTitle(null);
  }, [title, setPageTitle]);
}

function DashboardLayoutContent({ role, title }) {
  const { density } = useDashboardDensity();
  const { toggleSidebar } = useSidebar();

  React.useEffect(() => {
    if (role !== 'agent') return;

    const ping = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      apiClient.post('/agents/me/presence').catch(() => {});
    };

    ping();
    const timer = setInterval(ping, 30_000);
    return () => clearInterval(timer);
  }, [role]);

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
  const [pageTitle, setPageTitle] = useState(null);

  return (
    <DashboardThemeProvider role={effectiveRole}>
      <DashboardTitleContext.Provider value={{ pageTitle, setPageTitle }}>
        <TooltipProvider>
          <SidebarProvider style={{ '--sidebar-width': '18rem', '--sidebar-width-icon': '4rem' }}>
            <DashboardLayoutContent role={effectiveRole} title={title} />
          </SidebarProvider>
        </TooltipProvider>
      </DashboardTitleContext.Provider>
    </DashboardThemeProvider>
  );
}
