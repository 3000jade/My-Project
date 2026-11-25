import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Users, ShieldCheck, Clock, Send, UserPlus, RotateCw, Download,
  Search, SlidersHorizontal, ChevronRight, ChevronDown, MoreVertical,
  Check, AlertCircle, ArrowUpRight, ArrowDownRight,
  ExternalLink, Mail, Phone, Eye, FileText, Copy, Calendar,
  BarChart2, X, BadgeCheck, ClipboardList, MailPlus
} from 'lucide-react';
import DataTable from '../../../components/dashboard/DataTable';
import { Spinner } from '../../../components/ui';
import EmptyState from '../../../components/dashboard/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  useToast,
  Toaster
} from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { TableSkeleton } from '../../../components/dashboard/skeletons';
import AddAgentModal from '../../../components/dashboard/AddAgentModal';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../components/ui/dropdown-menu';
import { agentService } from '../../../services/agentService';
import { invitationService } from '../../../services/invitationService';
import { cn } from '../../../utils/cn';

function AgentAvatar({ src, name, size = "w-8 h-8", textSize = "text-xs" }) {
  const [imgError, setImgError] = useState(false);
  const initials = (name || 'Agent')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || 'A';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'Agent'}
        onError={() => setImgError(true)}
        className={cn(size, "rounded-full object-cover border border-[#E2E8F0]")}
      />
    );
  }

  return (
    <div
      className={cn(
        size,
        "rounded-full bg-slate-100 border border-[#E2E8F0] flex items-center justify-center font-bold text-slate-600 select-none",
        textSize
      )}
      title={name || 'Agent'}
    >
      {initials}
    </div>
  );
}

export default function BrokerAgents() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Popover menu state for row options
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);
  const menuRef = useRef(null);

  // Invitation state
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'invitations'
  const [invitationsFilter, setInvitationsFilter] = useState('ALL');
  const [invitations, setInvitations] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);
  const [addAgentModalOpen, setAddAgentModalOpen] = useState(false);
  const { toast } = useToast();

  const displayInvitations = invitations || [];

  const showToast = (msg, variant = 'success') => {
    toast({
      title: variant === 'destructive' ? 'Action Failed' : variant === 'primary' ? 'Invitation Details' : 'Agent Directory',
      description: msg,
      variant,
    });
  };

  // Close context menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuRowId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, auditData] = await Promise.all([
        agentService.getAgents(),
        Promise.resolve(agentService.getAuditEvents?.({ limit: 5 })).catch(() => []),
      ]);
      setAgents(Array.isArray(data) ? data : []);
      setRecentAudits(Array.isArray(auditData) ? auditData : []);
    } catch (err) {
      console.warn('Agent loading error:', err);
      setError(`Failed to load consultant directory: ${err?.message || 'Connection error'}`);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInvitations = useCallback(async () => {
    try {
      const data = await invitationService.getInvitations();
      setInvitations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load invitations:', err.message);
    }
  }, []);

  useEffect(() => {
    loadAgents();
    loadInvitations();
  }, [loadAgents, loadInvitations]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadAgents(), loadInvitations()]);
    setIsRefreshing(false);
    showToast('Agent directory refreshed');
  };

  const handleInviteSuccess = async ({ email }) => {
    showToast(`Invitation successfully sent to ${email}`);
    await Promise.all([loadInvitations(), loadAgents()]);
    setActiveTab('invitations');
  };

  const handleCreateAgentSuccess = async (created) => {
    showToast(`Agent "${created?.name || 'New Agent'}" added to roster`);
    await loadAgents();
    setActiveTab('roster');
  };

  const handleResend = async (agent) => {
    showToast(`Resending onboarding invitation to ${agent.email}...`, 'default');
    try {
      const inv = invitations.find(i => i.email === agent.email) || agent;
      if (inv && inv.id) {
        await invitationService.resendInvitation(inv.id);
        await loadInvitations();
        showToast(`Fresh 72-hour invitation email sent to ${agent.email}`);
      } else {
        showToast(`Could not find active invitation for ${agent.email}`, 'destructive');
      }
    } catch (err) {
      showToast(err.message || `Failed to resend invite to ${agent.email}`, 'destructive');
    }
  };

  // Real client-side CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Agent ID',
      'Name',
      'Role',
      'Email',
      'Phone',
      'Verification Status',
      'License Status',
      'PRC License No',
      'Assigned Listings',
      'Active Inquiries',
      'Closed Deals',
      'Last Activity'
    ];

    const rows = filteredAndSortedAgents.map(a => [
      `"${a.id || ''}"`,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${a.role || 'Agent'}"`,
      `"${a.email || ''}"`,
      `"${a.phone || ''}"`,
      `"${a.verification_status || 'PENDING'}"`,
      `"${a.license_status || '—'}"`,
      `"${a.prc_license_no || '—'}"`,
      a.assigned_properties_count ?? 0,
      a.active_inquiries_count ?? 0,
      a.recorded_sales_count ?? 0,
      `"${a.last_activity || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `human_shelter_agents_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Agent directory exported to CSV');
  };

  // Copy Agent ID helper
  const handleCopyAgentId = (id) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id);
      showToast(`Copied agent ID: ${id}`);
    } else {
      showToast(`Agent ID: ${id}`);
    }
    setActiveMenuRowId(null);
  };

  // Metrics computation
  const totalAgents = agents.length;
  const verifiedCount = agents.filter(a => (a.verification_status || '').toUpperCase() === 'VERIFIED').length;
  const pendingCount = agents.filter(a => (a.verification_status || '').toUpperCase() === 'PENDING').length;
  const suspendedCount = agents.filter(a => (a.verification_status || '').toUpperCase() === 'SUSPENDED').length;
  const activeInvitationsCount = (invitations || []).filter(
    i => (i.status || '').toLowerCase() === 'pending' && new Date(i.expires_at).getTime() > Date.now()
  ).length;

  // Filter & Sort Logic
  const filteredAndSortedAgents = useMemo(() => {
    let result = agents.filter(ag => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (ag.name && ag.name.toLowerCase().includes(q)) ||
        (ag.email && ag.email.toLowerCase().includes(q)) ||
        (ag.prc_license_no && ag.prc_license_no.toLowerCase().includes(q)) ||
        (ag.phone && ag.phone.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (ag.verification_status || '').toUpperCase() === statusFilter.toUpperCase();

      const matchesRole =
        roleFilter === 'ALL' ||
        (ag.role || '').toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesRole;
    });

    if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'deals') {
      result.sort((a, b) => (b.recorded_sales_count || 0) - (a.recorded_sales_count || 0));
    } else if (sortBy === 'listings') {
      result.sort((a, b) => (b.assigned_properties_count || 0) - (a.assigned_properties_count || 0));
    }

    return result;
  }, [agents, search, statusFilter, roleFilter, sortBy]);

  // Invitations Filter Logic (Screen 8)
  const filteredInvitations = useMemo(() => {
    return displayInvitations.filter(inv => {
      if (invitationsFilter === 'ALL') return true;
      return (inv.status || '').toUpperCase() === invitationsFilter;
    });
  }, [displayInvitations, invitationsFilter]);

  const invitationColumns = [
    {
      header: "Email",
      accessor: "email",
      className: "font-semibold text-[#1E293B]"
    },
    {
      header: "Role",
      accessor: "role",
      hideBelow: "sm",
      className: "text-[#64748B]"
    },
    {
      header: "Status",
      className: "min-w-[100px]",
      render: (row) => {
        const s = (row.status || 'Pending').toLowerCase();
        return (
          <span className={cn(
            "px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5",
            s === 'accepted' && "bg-emerald-50 text-emerald-700 border border-emerald-200",
            s === 'pending' && "bg-amber-50 text-amber-700 border border-amber-200",
            s === 'expired' && "bg-rose-50 text-rose-700 border border-rose-200"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              s === 'accepted' && "bg-emerald-500",
              s === 'pending' && "bg-amber-500",
              s === 'expired' && "bg-rose-500"
            )}></span>
            {row.status}
          </span>
        );
      }
    },
    {
      header: "Sent Date",
      className: "text-[#64748B]",
      render: (row) => row.sent_date || (row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')
    },
    {
      header: "Expires On",
      className: "text-[#64748B]",
      render: (row) => row.expires_on || (row.expires_at ? new Date(row.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {row.token && (
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/register/agent?token=${row.token}`;
                navigator.clipboard.writeText(url);
                showToast(`Copied onboarding link for ${row.email}`);
              }}
              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
              title="Copy single-use registration URL"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>
          )}
          {row.status?.toLowerCase() !== 'accepted' && (
            <button
              type="button"
              onClick={() => handleResend(row)}
              className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Resend
            </button>
          )}
          <button
            type="button"
            onClick={() => showToast(`Viewing invitation token metadata for ${row.email}`, 'primary')}
            className="px-3 py-1 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            View
          </button>
        </div>
      )
    }
  ];

  // Status Badge Component Helper
  const renderVerificationBadge = (statusStr) => {
    const status = (statusStr || 'PENDING').toUpperCase();
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Verified
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Pending
        </span>
      );
    }
    if (status === 'INVITED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
          Invited
        </span>
      );
    }
    if (status === 'DEPARTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Departed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        Suspended
      </span>
    );
  };

  // License Badge Helper
  const renderLicenseBadge = (licenseStr) => {
    const lic = (licenseStr || '').toUpperCase();
    if (lic === 'VALID') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Valid
        </span>
      );
    }
    if (lic === 'EXPIRING_SOON') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Expiring Soon
        </span>
      );
    }
    if (lic === 'EXPIRED') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Expired
        </span>
      );
    }
    if (lic === 'UNKNOWN' || lic === 'FOR_REVIEW' || lic === 'FOR REVIEW') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Validity unknown
        </span>
      );
    }
    return <span className="text-[#94A3B8] text-xs font-mono">—</span>;
  };

  // Table Columns Definition matching 10-column desktop mockup with balanced compact widths
  const columns = [
    {
      header: "Agent",
      className: "min-w-[170px]",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <AgentAvatar
              src={row.avatar}
              name={row.name}
              size="w-8 h-8"
              textSize="text-xs"
            />
            {row.verification_status === 'VERIFIED' && (
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full"></span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#1E293B] text-xs leading-snug truncate">{row.name}</p>
            <p className="text-[11px] text-[#64748B] capitalize">
              {row.role || 'Agent'}
              {row.routing_availability && row.routing_availability !== 'available' && (
                <span className="ml-1.5 text-[10px] font-semibold text-amber-600 uppercase">
                  • {row.routing_availability}
                </span>
              )}
            </p>
          </div>
        </div>
      )
    },
    {
      header: "Contact",
      className: "min-w-[135px]",
      hideBelow: "md",
      render: (row) => (
        <div>
          <p className="text-xs text-[#1E293B] font-medium leading-snug">{row.phone || 'Not provided'}</p>
          <p className="text-[11px] text-[#64748B] truncate">{row.email}</p>
        </div>
      )
    },
    {
      header: "Verification Status",
      className: "min-w-[105px]",
      render: (row) => renderVerificationBadge(row.verification_status)
    },
    {
      header: "License Status",
      className: "min-w-[85px]",
      hideBelow: "lg",
      render: (row) => renderLicenseBadge(row.license_status)
    },
    {
      header: "Listings",
      className: "text-center w-14",
      render: (row) => (
        <span className="text-xs font-semibold text-[#1E293B]">
          {row.assigned_properties_count ?? 0}
        </span>
      )
    },
    {
      header: "Inquiries",
      className: "text-center w-14",
      hideBelow: "lg",
      render: (row) => (
        <span className="text-xs font-medium text-[#64748B]">
          {row.active_inquiries_count ?? 0}
        </span>
      )
    },
    {
      header: "Closed Deals",
      className: "text-center w-16",
      render: (row) => (
        <span className="text-xs font-bold text-[#0F766E]">
          {row.recorded_sales_count ?? 0}
        </span>
      )
    },
    {
      header: "Last Activity",
      className: "min-w-[95px]",
      hideBelow: "xl",
      render: (row) => (
        <span className="text-xs text-[#64748B]">
          {row.last_activity || 'Oct 12, 2026'}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-right min-w-[95px]",
      render: (row) => {
        const status = (row.verification_status || '').toUpperCase();
        const isMenuOpen = activeMenuRowId === row.id;

        return (
          <div className="flex items-center justify-end gap-1.5 relative" onClick={(e) => e.stopPropagation()}>
            {status === 'PENDING' ? (
              <button
                type="button"
                onClick={() => navigate(`/broker/agents/${row.id}`)}
                className="px-3 py-1 bg-[#FF8559] hover:bg-[#F07144] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                Review
              </button>
            ) : status === 'INVITED' ? (
              <button
                type="button"
                onClick={() => handleResend(row)}
                className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                Resend
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(`/broker/agents/${row.id}`)}
                className="px-3 py-1 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                View
              </button>
            )}

            {/* Accessible Radix Context Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                  title="More options"
                  aria-label="More options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl border border-[#E2E8F0] bg-white shadow-lg text-xs z-30 font-sans">
                <DropdownMenuItem
                  onClick={() => navigate(`/broker/agents/${row.id}`)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1E293B] hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>View Dossier</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href={`mailto:${row.email}`}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1E293B] hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Send Direct Email</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-[#E2E8F0]" />
                <DropdownMenuItem
                  onClick={() => handleCopyAgentId(row.id)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1E293B] hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Copy Agent ID</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ];

  // Donut chart calculations
  const verifiedPct = totalAgents > 0 ? Math.round((verifiedCount / totalAgents) * 100) : 0;
  const pendingPct = totalAgents > 0 ? Math.round((pendingCount / totalAgents) * 100) : 0;
  const suspendedPct = totalAgents > 0 ? Math.round((suspendedCount / totalAgents) * 100) : 0;


  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
      {/* Action Cluster Header */}
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-end gap-2 w-full">
          <Button
            type="button"
            onClick={() => setAddAgentModalOpen(true)}
            className="h-11 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white gap-2 flex-1 sm:flex-none normal-case"
          >
            <UserPlus className="size-4 text-white" />
            <span>Add Agent</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-11 px-3.5 bg-white border-[#E2E8F0] text-[#1E293B] gap-1.5 shrink-0 normal-case"
            title="Refresh roster"
          >
            <RotateCw className={cn("size-4 text-[#64748B]", isRefreshing && "animate-spin")} />
            <span className="hidden xs:inline">Refresh</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCSV}
            className="h-11 px-3.5 bg-white border-[#E2E8F0] text-[#1E293B] gap-1.5 shrink-0 normal-case"
            title="Export agent data to CSV"
          >
            <Download className="size-4 text-[#64748B]" />
            <span className="hidden xs:inline">Export</span>
          </Button>
        </div>

      {/* Sub-Tabs: Agent Roster vs Invitations Ledger (Screen 8) */}
      <div className="flex items-center gap-4 sm:gap-6 mt-4 border-b border-[#E2E8F0] text-xs font-semibold overflow-x-auto scrollbar-none whitespace-nowrap">
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={cn(
            "pb-2.5 border-b-2 transition-colors cursor-pointer",
            activeTab === 'roster'
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-[#64748B] hover:text-[#1E293B]"
          )}
        >
          Agents ({totalAgents})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invitations')}
          className={cn(
            "pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === 'invitations'
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-[#64748B] hover:text-[#1E293B]"
          )}
        >
          <span>Invitations</span><span className="sr-only">Pending Invitations</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-[#64748B] font-mono">
            {displayInvitations.length}
          </span>
        </button>
      </div>

      {/* Main Responsive Layout (Active Roster) */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0 max-w-full">
          {/* Main Content Column (High-Density Console) */}
          <div className="min-w-0 max-w-full lg:col-span-12 space-y-6 transition-all duration-200">
            {/* Single-Row Inline Search + Filters Dropdown + Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-[#F1F5F9]">
              {/* Search Input */}
              <div className="relative flex-1 min-w-0 h-10">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, or PRC..."
                  className="w-full h-full pl-9 pr-14 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-all shadow-2xs"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                    ⌘K
                  </kbd>
                </div>
              </div>

              {/* Right Controls: Filters Dropdown + Sort + Reset */}
              <div className="flex items-center gap-2 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "h-10 px-3 bg-white hover:bg-slate-50 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0",
                        (statusFilter !== 'ALL' || roleFilter !== 'ALL')
                          ? "border-[#0F766E] text-[#0F766E] bg-teal-50/50"
                          : "border-[#E2E8F0] text-[#1E293B]"
                      )}
                      aria-label="Filters"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>Filters</span>
                      {(statusFilter !== 'ALL' || roleFilter !== 'ALL') && (
                        <span className="w-2 h-2 rounded-full bg-[#0F766E]"></span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-3 rounded-xl border border-[#E2E8F0] bg-white shadow-lg text-xs space-y-3 z-30 font-sans">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                      <span className="font-bold text-[#1E293B]">Filter Roster</span>
                      {(statusFilter !== 'ALL' || roleFilter !== 'ALL') && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter('ALL');
                            setRoleFilter('ALL');
                          }}
                          className="text-[11px] font-semibold text-[#0F766E] hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Status Selector */}
                    <div className="space-y-1">
                      <label htmlFor="roster-status-filter" className="text-[11px] font-semibold text-[#64748B]">
                        Status
                      </label>
                      <select
                        id="roster-status-filter"
                        aria-label="Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-8 px-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                      >
                        <option value="ALL">All Agents ({totalAgents})</option>
                        <option value="PENDING">Pending Review ({pendingCount})</option>
                        <option value="VERIFIED">Verified ({verifiedCount})</option>
                        <option value="INVITED">
                          Invited ({agents.filter(a => (a.verification_status || '').toUpperCase() === 'INVITED').length})
                        </option>
                        <option value="SUSPENDED">Suspended ({suspendedCount})</option>
                      </select>
                    </div>

                    {/* Role Selector */}
                    <div className="space-y-1">
                      <label htmlFor="roster-role-filter" className="text-[11px] font-semibold text-[#64748B]">
                        Role
                      </label>
                      <select
                        id="roster-role-filter"
                        aria-label="Role"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full h-8 px-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                      >
                        <option value="ALL">All Roles</option>
                        <option value="Senior Agent">Senior Agent</option>
                        <option value="Agent">Agent</option>
                      </select>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort Dropdown */}
                <div className="relative shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-10 pl-3 pr-7 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-all appearance-none cursor-pointer shadow-2xs"
                    aria-label="Sort agents"
                  >
                    <option value="newest">Sort: Newest</option>
                    <option value="name">Sort: Name (A-Z)</option>
                    <option value="deals">Sort: Deals</option>
                    <option value="listings">Sort: Listings</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Reset Filters Icon Button (Visible when any non-default filter is active) */}
                {(search || statusFilter !== 'ALL' || roleFilter !== 'ALL' || sortBy !== 'newest') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('ALL');
                      setRoleFilter('ALL');
                      setSortBy('newest');
                    }}
                    className="h-10 w-10 flex items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-[#0F766E] hover:bg-teal-100 transition-colors cursor-pointer shadow-2xs shrink-0"
                    title="Reset all filters"
                    aria-label="Reset all filters"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Error State with Retry */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={loadAgents}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer shrink-0 shadow-2xs"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Table / Mobile Cards View */}
            {loading ? (
              <TableSkeleton rows={6} />
            ) : filteredAndSortedAgents.length === 0 ? (
              <EmptyState
                icon="badge"
                title="No agents match your criteria"
                description="Try adjusting your search terms or clearing your status and role filters."
                action={
                  <button
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('ALL');
                      setRoleFilter('ALL');
                    }}
                    className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-2xs"
                  >
                    Reset Filters
                  </button>
                }
              />
            ) : (
              <>
                {/* Mobile View (< md): Adaptive Cards */}
                <div className="md:hidden space-y-3">
                  {filteredAndSortedAgents.map((ag) => (
                    <div
                      key={ag.id}
                      onClick={() => navigate(`/broker/agents/${ag.id}`)}
                      className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs space-y-3 cursor-pointer hover:border-[#CBD5E1] transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <AgentAvatar
                            src={ag.avatar}
                            name={ag.name}
                            size="w-10 h-10"
                            textSize="text-sm"
                          />
                          <div>
                            <p className="font-semibold text-[#1E293B] text-sm">Consultant: {ag.name}</p>
                            <p className="text-xs text-[#64748B] capitalize">{ag.role || 'Agent'}</p>
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          {renderVerificationBadge(ag.verification_status)}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#F1F5F9] grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Contact</span>
                          <p className="text-[#1E293B] font-medium">{ag.phone || 'Not provided'}</p>
                          <p className="text-[#64748B] text-[11px] truncate">{ag.email}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#64748B] uppercase font-semibold block">License Status</span>
                          <div className="mt-0.5">{renderLicenseBadge(ag.license_status)}</div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span><strong className="text-[#1E293B]">{ag.assigned_properties_count ?? 0}</strong> listings</span>
                          <span><strong className="text-[#0F766E]">{ag.recorded_sales_count ?? 0}</strong> deals</span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          {ag.verification_status === 'PENDING' ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/broker/agents/${ag.id}`)}
                              className="px-3 py-1 bg-[#FF8559] hover:bg-[#F07144] text-white text-xs font-semibold rounded-lg shadow-2xs"
                            >
                              Review
                            </button>
                          ) : ag.verification_status === 'INVITED' ? (
                            <button
                              type="button"
                              onClick={() => handleResend(ag)}
                              className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold rounded-lg shadow-2xs"
                            >
                              Resend
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => navigate(`/broker/agents/${ag.id}`)}
                              className="px-3 py-1 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] text-xs font-semibold rounded-lg shadow-2xs"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tablet & Desktop View (>= md): Full Data Table with Numbered Pagination */}
                <div className="hidden md:block min-w-0 w-full overflow-hidden">
                  <DataTable
                    columns={columns}
                    data={filteredAndSortedAgents}
                    pageSize={8}
                    selectable={true}
                    stickyFirstColumn={true}
                    selectedKeys={selectedKeys}
                    onToggleSelect={(id) => {
                      setSelectedKeys((prev) => {
                        const next = new Set(prev);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      });
                    }}
                    onToggleSelectAll={(ids) => {
                      setSelectedKeys((prev) => {
                        const allSelected = ids.every(id => prev.has(id));
                        const next = new Set(prev);
                        if (allSelected) {
                          ids.forEach(id => next.delete(id));
                        } else {
                          ids.forEach(id => next.add(id));
                        }
                        return next;
                      });
                    }}
                    onRowClick={(row) => navigate(`/broker/agents/${row.id}`)}
                  />
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* Screen 8: Agent Invitations Manager */}
      {activeTab === 'invitations' && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Agent Invitations</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Manage and track sent invitations.</p>
            </div>
            <button
              type="button"
              onClick={() => setAddAgentModalOpen(true)}
              className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Agent</span>
            </button>
          </div>

          {/* Filter Tabs Matching Mockup Screen 8 */}
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold overflow-x-auto">
            {[
              { id: 'ALL', label: `All Invitations (${displayInvitations.length})` },
              { id: 'PENDING', label: `Pending (${displayInvitations.filter(i => (i.status || '').toLowerCase() === 'pending').length})` },
              { id: 'ACCEPTED', label: `Accepted (${displayInvitations.filter(i => (i.status || '').toLowerCase() === 'accepted').length})` },
              { id: 'EXPIRED', label: `Expired (${displayInvitations.filter(i => (i.status || '').toLowerCase() === 'expired').length})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInvitationsFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0",
                  invitationsFilter === tab.id
                    ? "bg-[#0F766E] text-white"
                    : "text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <DataTable
            columns={invitationColumns}
            data={filteredInvitations}
            pageSize={8}
          />
        </div>
      )}

      {/* Unified Add Agent Choice Modal (Create or Invite) */}
      <AddAgentModal
        isOpen={addAgentModalOpen}
        onClose={() => setAddAgentModalOpen(false)}
        onInviteSuccess={handleInviteSuccess}
        onCreateSuccess={handleCreateAgentSuccess}
      />
      <Toaster position="top-right" />
    </div>
  );
}
