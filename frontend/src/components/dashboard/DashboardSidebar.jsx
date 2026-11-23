import React, { useState, useEffect, useContext } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Calendar,
  FileText,
  Bookmark,
  Compass,
  User,
  Settings,
  Shield,
  Database,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import AuthContext from '../../context/AuthContext';
import { inquiryService } from '../../services/inquiryService';
import { clientUserService } from '../../services/clientUserService';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

export default function DashboardSidebar({ role = 'broker', onClose }) {
  const location = useLocation();
  const auth = useContext(AuthContext);
  const user = auth?.user || null;

  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;

  const [unreadInquiries, setUnreadInquiries] = useState(0);

  // Live unread / new inquiry count for the sidebar badge
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list =
          role === 'client'
            ? await clientUserService.getClientInquiries()
            : await inquiryService.getInquiries(
                role === 'agent' && user?.id ? { agentId: user.id } : {}
              );
        if (!active || !Array.isArray(list)) return;
        const count = list.filter((item) => {
          const st = String(item.status || '').toUpperCase();
          return st === 'NEW' || st === 'REOPENED';
        }).length;
        setUnreadInquiries(count);
      } catch {
        // Ignore silently when unauthenticated or offline
      }
    })();
    return () => {
      active = false;
    };
  }, [role, user?.id]);

  const adminSections = [
    {
      title: 'Administration',
      items: [
        { to: '/admin/users', label: 'Users & Roles', icon: Shield },
        { to: '/admin/cms', label: 'Website CMS', icon: FileText },
        { to: '/admin/data-management', label: 'Data Management', icon: Database },
      ],
    },
    {
      title: 'Operations',
      items: [
        { to: '/broker/dashboard', label: 'Broker Dashboard', icon: LayoutDashboard },
        { to: '/broker/properties', label: 'Properties', icon: Building2 },
      ],
    },
  ];

  const brokerSections = [
    {
      title: 'Overview',
      items: [{ to: '/broker/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Management',
      items: [
        { to: '/broker/properties', label: 'Properties', icon: Building2 },
        { to: '/broker/inquiries', label: 'Inquiries', icon: MessageSquare, hasUnreadBadge: true },
        { to: '/broker/agents', label: 'Agents', icon: User },
      ],
    },
    {
      title: 'Analytics & System',
      items: [
        { to: '/broker/reports', label: 'Reports', icon: FileText },
        { to: '/broker/audit', label: 'Audit Trail', icon: Shield },
      ],
    },
  ];

  const agentLinks = [
    { to: '/agent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/agent/properties', label: 'Properties', icon: Building2 },
    { to: '/agent/inquiries', label: 'Inquiries', icon: MessageSquare, hasUnreadBadge: true },
    { to: '/agent/availability', label: 'Schedule & Availability', icon: Calendar },
    { to: '/agent/sales', label: 'Sales', icon: FileText },
  ];

  const clientLinks = [
    { to: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/client/saved-properties', label: 'Saved Properties', icon: Bookmark },
    { to: '/client/inquiries', label: 'My Inquiries', icon: MessageSquare, hasUnreadBadge: true },
    { to: '/properties', label: 'Explore Listings', icon: Compass },
    { to: '/about', label: 'About', icon: Info },
  ];

  const settingsPath =
    role === 'broker' || role === 'admin'
      ? '/broker/profile'
      : role === 'agent'
      ? '/agent/profile'
      : '/client/profile';
  const isSettingsActive = location.pathname === settingsPath;

  const sections =
    role === 'admin'
      ? adminSections
      : role === 'broker'
      ? brokerSections
      : [{ title: 'Workspace', items: role === 'client' ? clientLinks : agentLinks }];

  const roleLabel =
    role === 'admin'
      ? 'SUPER ADMIN'
      : role === 'broker'
      ? 'BROKER PORTAL'
      : role === 'agent'
      ? 'AGENT WORKSPACE'
      : 'CLIENT PORTAL';

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
    if (onClose) onClose();
  };

  return (
    <Sidebar
      collapsible="icon"
      aria-label="Dashboard Sidebar"
      data-sidebar-theme="deep-teal"
      className="border-r border-[#0A3D3C] rounded-r-lg [&_[data-slot=sidebar-inner]]:bg-[#032626] [&_[data-slot=sidebar-inner]]:text-white [&_[data-slot=sidebar-inner]]:rounded-r-lg"
    >
      {/* Brand Header */}
      <SidebarHeader className="h-16 px-4 border-b border-teal-900/60 flex-row items-center justify-between">
        <Link
          to={role === 'broker' ? '/broker/dashboard' : '/'}
          className={cn('flex items-center gap-3 min-w-0 group', isCollapsed && 'hidden')}
        >
          <div className="size-8 rounded-md bg-[#0F766E] flex items-center justify-center text-white shadow-xs shrink-0 ring-1 ring-teal-400/30 group-hover:ring-teal-400/60 transition-all">
            <Building2 className="size-4 text-white" />
          </div>
          <div className="truncate min-w-0 text-left">
            <span className="font-bold text-xs tracking-wider text-white block uppercase truncate group-hover:text-teal-200 transition-colors">
              HUMAN SHELTER REALTY
            </span>
            <span className="text-[9px] text-teal-300/80 block uppercase tracking-widest truncate font-medium">
              {roleLabel}
            </span>
          </div>
        </Link>

        <SidebarTrigger
          className={cn(
            'hidden md:inline-flex size-8 text-teal-300 hover:text-white hover:bg-white/10 shrink-0',
            isCollapsed && 'mx-auto'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        />
      </SidebarHeader>

      {/* Navigation Groups */}
      <SidebarContent className="px-2 py-3 gap-2 custom-scrollbar" data-lenis-prevent="true">
        {sections.map((section) => (
          <SidebarGroup key={section.title} className="p-1">
            <SidebarGroupLabel className="text-[10px] font-semibold text-teal-300/60 uppercase tracking-wider px-2">
              {section.title}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {section.items.map((link) => {
                const Icon = link.icon;
                const isProperties = link.label === 'Properties';
                const isAgents = link.label === 'Agents';
                const isActive = isProperties
                  ? location.pathname.includes('/properties')
                  : isAgents
                  ? location.pathname.startsWith('/broker/agents') ||
                    location.pathname.startsWith('/broker/appointments')
                  : location.pathname === link.to;

                return (
                  <SidebarMenuItem key={link.to + link.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={link.label}
                      onClick={handleNavClick}
                      render={<NavLink to={link.to} />}
                      className={cn(
                        'rounded-md text-xs font-medium transition-colors h-10 px-3',
                        isActive
                          ? 'bg-[#0F766E] text-white font-semibold shadow-xs ring-1 ring-teal-400/20 hover:bg-[#0F766E] hover:text-white data-active:bg-[#0F766E] data-active:text-white'
                          : 'text-teal-100/75 hover:text-white hover:bg-white/5 active:bg-white/10'
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-4 shrink-0',
                          isActive ? 'text-white' : 'text-teal-200/70'
                        )}
                      />
                      <span className="truncate">{link.label}</span>
                    </SidebarMenuButton>

                    {link.hasUnreadBadge && unreadInquiries > 0 && (
                      <SidebarMenuBadge className="bg-[#FF6B6B] text-[#1E293B] font-semibold rounded-full px-1.5 text-[10px] tabular-nums">
                        {unreadInquiries}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Bottom Pinned Settings */}
      <SidebarFooter className="p-3 border-t border-teal-900/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isSettingsActive}
              tooltip="Settings"
              onClick={handleNavClick}
              aria-label="Settings"
              render={<NavLink to={settingsPath} />}
              className={cn(
                'rounded-md text-xs font-medium transition-colors h-10 px-3',
                isSettingsActive
                  ? 'bg-[#0F766E] text-white font-semibold shadow-xs ring-1 ring-teal-400/20 hover:bg-[#0F766E] hover:text-white data-active:bg-[#0F766E] data-active:text-white'
                  : 'text-teal-100/75 hover:text-white hover:bg-white/5 active:bg-white/10'
              )}
            >
              <Settings
                className={cn(
                  'size-4 shrink-0',
                  isSettingsActive ? 'text-white' : 'text-teal-200/70'
                )}
              />
              <span className="truncate">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
