import React, { useState, useEffect, useContext } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Bookmark,
  Compass,
  Users,
  Settings,
  Shield,
  ShieldCheck,
  Database,
  Info,
  Globe,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
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
        { to: '/admin/users', label: 'Users', icon: Shield },
        { to: '/admin/cms', label: 'Website CMS', icon: Globe },
        { to: '/admin/data-management', label: 'Data Management', icon: Database },
      ],
    },
    {
      title: 'Operations',
      items: [
        { to: '/broker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
        { to: '/broker/agents', label: 'Agents', icon: Users },
      ],
    },
  ];

  const agentLinks = [
    { to: '/agent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/agent/properties', label: 'Properties', icon: Building2 },
    { to: '/agent/inquiries', label: 'Inquiries', icon: MessageSquare, hasUnreadBadge: true },
  ];

  const clientLinks = [
    { to: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/client/saved-properties', label: 'Saved Properties', icon: Bookmark },
    { to: '/client/inquiries', label: 'Inquiries', icon: MessageSquare, hasUnreadBadge: true },
    { to: '/properties', label: 'Explore Listings', icon: Compass },
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
      data-sidebar-theme="teal"
      className="border-r border-[#0F766E]/40 [&_[data-slot=sidebar-inner]]:!bg-[#134E4A] [&_[data-slot=sidebar-inner]]:text-white"
    >
      {/* Brand Header */}
      <SidebarHeader
        className={cn(
          'h-16 border-b border-white/15 flex-row items-center gap-2',
          isCollapsed ? 'px-2 justify-center' : 'px-4 justify-between'
        )}
      >
        <Link
          to={role === 'broker' ? '/broker/dashboard' : '/'}
          className={cn('flex items-center gap-2 min-w-0 group', isCollapsed && 'hidden')}
        >
          <div className="size-10 rounded-lg bg-surface flex items-center justify-center p-1 shadow-xs shrink-0">
            <img
              src="/images/human-shelter-logo.webp"
              alt="Human Shelter Realty"
              className="size-full object-contain"
            />
          </div>
          <div className="truncate min-w-0 text-left">
            <span className="font-bold text-sm tracking-tight text-white block uppercase whitespace-nowrap group-hover:text-tertiary-container transition-colors">
              HUMAN SHELTER REALTY
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-tertiary-container uppercase tracking-wider truncate font-semibold">
              <span className="size-2 rounded-full bg-[#FF6B6B] shrink-0" aria-hidden="true" />
              <span className="truncate">{roleLabel}</span>
            </span>
          </div>
        </Link>

        <SidebarTrigger
          className={cn(
            'hidden md:inline-flex size-9 rounded-lg bg-white/10 text-white hover:bg-white/20 shrink-0',
            isCollapsed && 'mx-auto'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </SidebarTrigger>
      </SidebarHeader>

      {/* Navigation Groups */}
      <SidebarContent
        className="px-4 py-4 gap-6 group-data-[collapsible=icon]:px-2 custom-scrollbar"
        data-lenis-prevent="true"
      >
        {sections.map((section) => (
          <SidebarGroup key={section.title} className="p-0">
            <SidebarGroupLabel className="text-xs font-semibold text-tertiary-container/80 uppercase tracking-wider px-2">
              {section.title}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-2">
              {section.items.map((link) => {
                const Icon = link.icon;
                const isProperties = link.label === 'Properties';
                const isAgents = link.label === 'Agents';
                const isActive = isProperties
                  ? location.pathname.includes('/properties')
                  : isAgents
                  ? location.pathname.startsWith('/broker/agents')
                  : location.pathname === link.to;

                return (
                  <SidebarMenuItem key={link.to + link.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={link.label}
                      onClick={handleNavClick}
                      render={<NavLink to={link.to} />}
                      className={cn(
                        'rounded-lg text-sm font-medium transition-colors h-12 px-4 gap-4 [&_svg]:size-5 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0!',
                        isActive
                          ? 'bg-surface text-primary font-semibold shadow-xs hover:bg-background hover:text-primary data-active:bg-surface data-active:text-primary'
                          : 'text-white/85 hover:text-white hover:bg-white/10 active:bg-white/15'
                      )}
                    >
                      <Icon
                        strokeWidth={isActive ? 2.2 : 1.75}
                        className={cn(
                          'size-5 shrink-0 transition-transform duration-150 group-hover/menu-button:scale-105 motion-reduce:transition-none',
                          isActive ? 'text-primary' : 'text-tertiary-container group-hover/menu-button:text-white'
                        )}
                      />
                      <span className="truncate group-data-[collapsible=icon]:hidden">{link.label}</span>
                    </SidebarMenuButton>

                    {link.hasUnreadBadge && unreadInquiries > 0 && (
                      <SidebarMenuBadge className="bg-[#FF6B6B] text-white font-bold rounded-full px-2 text-xs tabular-nums group-data-[collapsible=icon]:hidden">
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
      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2 border-t border-white/15">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isSettingsActive}
              tooltip="Settings"
              onClick={handleNavClick}
              aria-label="Settings"
              render={<NavLink to={settingsPath} />}
              className={cn(
                'rounded-lg text-sm font-medium transition-colors h-12 px-4 gap-4 [&_svg]:size-5 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0!',
                isSettingsActive
                  ? 'bg-surface text-primary font-semibold shadow-xs hover:bg-background hover:text-primary data-active:bg-surface data-active:text-primary'
                  : 'text-white/85 hover:text-white hover:bg-white/10 active:bg-white/15'
              )}
            >
              <Settings
                strokeWidth={isSettingsActive ? 2.2 : 1.75}
                className={cn(
                  'size-5 shrink-0 transition-transform duration-150 group-hover/menu-button:scale-105 motion-reduce:transition-none',
                  isSettingsActive ? 'text-primary' : 'text-tertiary-container group-hover/menu-button:text-white'
                )}
              />
              <span className="truncate group-data-[collapsible=icon]:hidden">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
