import React, { Suspense, createContext, useContext, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import { DashboardThemeProvider, useDashboardDensity } from '../../context/DashboardThemeContext';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { Button } from '@/components/ui/button';
import { DashboardPageSkeleton } from './skeletons';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export const DashboardTitleContext = createContext({
  pageTitle: null,
  setPageTitle: () => {},
});

const PRESENCE_MIN_INTERVAL_MS = 25_000;
let lastPresencePingAt = 0;

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
  const [incomingLiveChat, setIncomingLiveChat] = useState(null);

  React.useEffect(() => {
    if (role !== 'agent') return;

    const ping = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - lastPresencePingAt < PRESENCE_MIN_INTERVAL_MS) return;
      lastPresencePingAt = now;
      apiClient.post('/agents/me/presence').catch(() => {});
    };

    ping();
    const timer = setInterval(ping, 30_000);
    return () => clearInterval(timer);
  }, [role]);

  React.useEffect(() => {
    if (role !== 'agent' || typeof window === 'undefined' || typeof fetch !== 'function') return;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('cp_auth_token') : null;
    if (!token) return;

    const rawBase = String(apiClient.defaults?.baseURL || '/api').replace(/\/+$/, '');
    const controller = new AbortController();

    fetch(`${rawBase}/inquiries/stream`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok || !res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = 'message';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const rawLine of lines) {
            const line = rawLine.trimEnd();
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              try {
                const payload = JSON.parse(line.slice(5).trim());
                if (currentEvent === 'inquiry:assigned' && payload?.source === 'ai_chatbot_live' && payload?.inquiryId) {
                  setIncomingLiveChat({
                    inquiryId: payload.inquiryId,
                    clientName: payload.clientName || 'A visitor',
                    propertyTitle: payload.propertyTitle || 'Property inquiry',
                  });
                }
              } catch {
                // Ignore malformed SSE frame
              }
            }
          }
        }
      })
      .catch(() => {});

    return () => controller.abort();
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
          {incomingLiveChat && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white border border-[#0F766E]/30 shadow-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="size-10 rounded-full bg-emerald-50 text-[#0F766E] border border-emerald-200 flex items-center justify-center shrink-0">
                  <MessageCircle className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#10B981] motion-safe:animate-pulse" aria-hidden="true" />
                    <p className="text-sm font-semibold text-[#1E293B]">
                      Live Chat Request from {incomingLiveChat.clientName}
                    </p>
                  </div>
                  <p className="text-xs text-[#64748B] truncate">
                    {incomingLiveChat.propertyTitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/agent/inquiries/messages/${incomingLiveChat.inquiryId}`}
                  onClick={() => setIncomingLiveChat(null)}
                  className="inline-flex items-center justify-center rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold px-4 min-h-10 transition-colors"
                >
                  Open Live Chat
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Dismiss live chat alert"
                  onClick={() => setIncomingLiveChat(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          )}
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
