import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Users, ShieldCheck, Clock, Send, UserPlus, RotateCw, Download,
  Search, SlidersHorizontal, ChevronRight, ChevronDown, MoreVertical,
  Check, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight,
  ExternalLink, Mail, Phone, Eye, FileText, Copy, Calendar
} from 'lucide-react';
import DataTable from '../../../components/dashboard/DataTable';
import EmptyState from '../../../components/dashboard/EmptyState';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import AgentScheduleCalendar from '../../../components/dashboard/AgentScheduleCalendar';
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
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'calendar' ? 'calendar' : 'roster';
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Popover menu state for row options
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);
  const menuRef = useRef(null);

  // Invitation & Teams state
  const [activeTab, setActiveTab] = useState(initialTab); // 'roster' | 'invitations' | 'teams' | 'calendar'
  const [invitationsFilter, setInvitationsFilter] = useState('ALL');
  const [invitations, setInvitations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamBranch, setNewTeamBranch] = useState('Manila Head Office');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteAgency, setInviteAgency] = useState('Human Shelter Realty Manila');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const displayInvitations = invitations || [];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
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
      const [data, teamData, auditData] = await Promise.all([
        agentService.getAgents(),
        Promise.resolve(agentService.getTeams?.()).catch(() => []),
        Promise.resolve(agentService.getAuditEvents?.({ limit: 5 })).catch(() => []),
      ]);
      setAgents(Array.isArray(data) ? data : []);
      setTeams(Array.isArray(teamData) ? teamData : []);
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

  const handleCreateTeam = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreatingTeam(true);
    try {
      await agentService.createTeam({
        name: newTeamName.trim(),
        locationBranch: newTeamBranch.trim() || 'Manila',
      });
      setNewTeamName('');
      await loadAgents();
      showToast(`Created team "${newTeamName.trim()}"`);
    } catch (err) {
      showToast(err?.message || 'Failed to create team');
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleSendInvite = async (e, allowReissue = false) => {
    if (e && e.preventDefault) e.preventDefault();
    setInviteSubmitting(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      await invitationService.createInvitation({
        email: inviteEmail,
        brokerAgency: inviteAgency,
        message: inviteMessage,
        allowReissue,
      });

      setInviteSuccess(`Invitation dispatched to ${inviteEmail}.`);
      showToast(`Invitation successfully sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteMessage('');
      await loadInvitations();
      await loadAgents();
      setActiveTab('invitations');
      setTimeout(() => {
        setInviteModalOpen(false);
        setInviteSuccess('');
      }, 1200);
    } catch (err) {
      setInviteError(err.message || 'Failed to dispatch invitation.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleReissueInvite = () => {
    handleSendInvite(null, true);
  };

  const handleResend = async (agent) => {
    showToast(`Resending onboarding invitation to ${agent.email}...`);
    try {
      const inv = invitations.find(i => i.email === agent.email) || agent;
      if (inv && inv.id) {
        await invitationService.resendInvitation(inv.id);
        await loadInvitations();
        showToast(`Fresh 72-hour invitation email sent to ${agent.email}`);
      } else {
        showToast(`Could not find active invitation for ${agent.email}`);
      }
    } catch (err) {
      showToast(err.message || `Failed to resend invite to ${agent.email}`);
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

      const matchesTeam =
        teamFilter === 'ALL' ||
        ag.team_id === teamFilter ||
        ag.team_name === teamFilter;

      return matchesSearch && matchesStatus && matchesRole && matchesTeam;
    });

    if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'deals') {
      result.sort((a, b) => (b.recorded_sales_count || 0) - (a.recorded_sales_count || 0));
    } else if (sortBy === 'listings') {
      result.sort((a, b) => (b.assigned_properties_count || 0) - (a.assigned_properties_count || 0));
    }

    return result;
  }, [agents, search, statusFilter, roleFilter, teamFilter, sortBy]);

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
            onClick={() => showToast(`Viewing invitation token metadata for ${row.email}`)}
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
                className="px-3 py-1 bg-[#FF6B6B] hover:bg-[#EE5A5A] text-[#1E293B] text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
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

            {/* Context Menu Trigger */}
            <button
              type="button"
              onClick={() => setActiveMenuRowId(isMenuOpen ? null : row.id)}
              className="p-1 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
              title="More options"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Context Menu Popover */}
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-8 w-44 bg-white border border-[#E2E8F0] rounded-lg shadow-lg py-1 z-30 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/broker/agents/${row.id}`);
                    setActiveMenuRowId(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 text-[#1E293B] font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>View Dossier</span>
                </button>
                <a
                  href={`mailto:${row.email}`}
                  onClick={() => setActiveMenuRowId(null)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 text-[#1E293B] font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Send Direct Email</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyAgentId(row.id)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 text-[#1E293B] font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Copy Agent ID</span>
                </button>
              </div>
            )}
          </div>
        );
      }
    }
  ];

  // Donut chart calculations
  const verifiedPct = totalAgents > 0 ? Math.round((verifiedCount / totalAgents) * 100) : 0;
  const pendingPct = totalAgents > 0 ? Math.round((pendingCount / totalAgents) * 100) : 0;
  const suspendedPct = totalAgents > 0 ? Math.round((suspendedCount / totalAgents) * 100) : 0;

  const circumference = 251.327; // 2 * Math.PI * 40
  const verifiedStroke = (verifiedPct / 100) * circumference;
  const pendingStroke = (pendingPct / 100) * circumference;
  const suspendedStroke = (suspendedPct / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1E293B] text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-2 font-medium">
          <span>Agents</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="text-[#1E293B] font-semibold">Agent Management</span>
        </div>

        {/* Page Title & Action Cluster Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
              Agent Management — Agent Directory & Credential Verification
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Manage agent profiles, review submitted credentials, send invitations, and monitor agent activity.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setInviteModalOpen(true)}
              className="h-10 px-4 bg-[#FF6B6B] hover:bg-[#EE5A5A] text-[#1E293B] rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Agent</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-10 px-3.5 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Refresh roster"
            >
              <RotateCw className={cn("w-4 h-4 text-[#64748B]", isRefreshing && "animate-spin")} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="h-10 px-3.5 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Export agent data to CSV"
            >
              <Download className="w-4 h-4 text-[#64748B]" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs: Agent Roster vs Invitations Ledger (Screen 8) */}
        <div className="flex items-center gap-6 mt-4 border-b border-[#E2E8F0] text-xs font-semibold">
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
            Agent Management ({totalAgents})
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
            <span>Agent Invitations</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-[#64748B] font-mono">
              {displayInvitations.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={cn(
              "pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
              activeTab === 'calendar'
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-[#64748B] hover:text-[#1E293B]"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar & Appointments</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            className={cn(
              "pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
              activeTab === 'teams'
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-[#64748B] hover:text-[#1E293B]"
            )}
          >
            <span>Teams</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-[#64748B] font-mono">
              {teams.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout (Active Roster) */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Main Content: KPIs, Filters, Table/Cards) ~72% */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">

            {/* 4 Metric Plinths with Sparklines (2-col mobile/tablet, 4-col desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

              {/* Card 1: Total Agents */}
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">Total Consultants</p>
                    <p className="text-2xl font-bold text-[#1E293B] mt-1">{totalAgents}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-[#0F766E] shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <ArrowUpRight className="w-3 h-3" />
                    20% vs last month
                  </span>
                  <svg className="w-12 sm:w-14 h-5 text-[#0F766E] hidden sm:block" viewBox="0 0 60 20" fill="none">
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="2,18 12,14 24,15 36,8 48,10 58,2"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 2: Verified Agents */}
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">Verified Active</p>
                    <p className="text-2xl font-bold text-[#1E293B] mt-1">{verifiedCount}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <ArrowUpRight className="w-3 h-3" />
                    14% vs last month
                  </span>
                  <svg className="w-12 sm:w-14 h-5 text-emerald-600 hidden sm:block" viewBox="0 0 60 20" fill="none">
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="2,17 14,15 26,12 38,13 46,7 58,3"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 3: Pending Review */}
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">Pending Review</p>
                    <p className="text-2xl font-bold text-[#1E293B] mt-1">{pendingCount}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                    <ArrowDownRight className="w-3 h-3" />
                    25% vs last month
                  </span>
                  <svg className="w-12 sm:w-14 h-5 text-amber-600 hidden sm:block" viewBox="0 0 60 20" fill="none">
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="2,4 12,6 24,12 36,9 48,15 58,17"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 4: Active Invitations */}
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">Active Invitations</p>
                    <p className="text-2xl font-bold text-[#1E293B] mt-1">{activeInvitationsCount}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded">
                    Pending onboarding
                  </span>
                  <svg className="w-12 sm:w-14 h-5 text-sky-600 hidden sm:block" viewBox="0 0 60 20" fill="none">
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="2,12 14,12 26,10 38,11 48,10 58,10"
                    />
                  </svg>
                </div>
              </div>

            </div>

            {/* Single-Row Search and Multi-Dropdown Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search agent name, email, or license..."
                  className="w-full h-10 pl-10 pr-4 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-all shadow-2xs"
                />
              </div>

              {/* Filter Dropdowns Container */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                {/* Verification Status Dropdown */}
                <div className="relative flex-1 sm:flex-none min-w-[140px] sm:min-w-[155px]">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-10 pl-3.5 pr-8 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-all appearance-none cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">All Verification Status</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="PENDING">Pending</option>
                    <option value="INVITED">Invited</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="DEPARTED">Departed</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Roles Dropdown */}
                <div className="relative flex-1 sm:flex-none min-w-[110px] sm:min-w-[125px]">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full h-10 pl-3.5 pr-8 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-all appearance-none cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="Senior Agent">Senior Agent</option>
                    <option value="Agent">Agent</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Teams Dropdown */}
                {teams.length > 0 && (
                  <div className="relative flex-1 sm:flex-none min-w-[110px] sm:min-w-[130px]">
                    <select
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="w-full h-10 pl-3.5 pr-8 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-all appearance-none cursor-pointer shadow-2xs"
                    >
                      <option value="ALL">All Teams</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}

                {/* Sort Dropdown */}
                <div className="relative flex-1 sm:flex-none min-w-[135px] sm:min-w-[145px]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-10 pl-3.5 pr-8 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-all appearance-none cursor-pointer shadow-2xs"
                  >
                    <option value="newest">Sort by Newest First</option>
                    <option value="name">Name A-Z</option>
                    <option value="deals">Most Deals</option>
                    <option value="listings">Most Listings</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Reset/Filter Preferences Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                    setRoleFilter('ALL');
                    setTeamFilter('ALL');
                    setSortBy('newest');
                  }}
                  className="h-10 w-10 flex items-center justify-center rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer shadow-2xs shrink-0"
                  title="Reset filters"
                  aria-label="Reset filters"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
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
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center space-y-3">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0F766E] border-t-transparent"></div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Loading agent roster...
                </p>
              </div>
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
                              className="px-3 py-1 bg-[#FF6B6B] hover:bg-[#EE5A5A] text-[#1E293B] text-xs font-semibold rounded-lg shadow-2xs"
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
                <div className="hidden md:block">
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

          {/* Right Column (Widgets) ~28% on Desktop, 2-Column Balanced on Tablet */}
          <div className="lg:col-span-4 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">

            {/* Widget 1: Verification Summary */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-[#1E293B]">Verification Summary</h3>

              {/* SVG Donut Chart */}
              <div className="relative w-40 h-40 mx-auto my-4 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="10"
                  />
                  {/* Verified Segment (Emerald) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth="10"
                    strokeDasharray={`${verifiedStroke} ${circumference}`}
                    strokeDashoffset="0"
                  />
                  {/* Pending Segment (Amber) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#F59E0B"
                    strokeWidth="10"
                    strokeDasharray={`${pendingStroke} ${circumference}`}
                    strokeDashoffset={`-${verifiedStroke}`}
                  />
                  {/* Suspended Segment (Slate) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#94A3B8"
                    strokeWidth="10"
                    strokeDasharray={`${suspendedStroke} ${circumference}`}
                    strokeDashoffset={`-${verifiedStroke + pendingStroke}`}
                  />
                </svg>

                {/* Inner Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-[#1E293B] leading-none">{totalAgents}</span>
                  <span className="text-[11px] text-[#64748B] font-medium mt-1">Agents</span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F1F5F9] text-xs">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[#64748B] text-[11px]">Verified</span>
                  </div>
                  <span className="font-semibold text-[#1E293B] mt-0.5">{verifiedCount} ({verifiedPct}%)</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-[#64748B] text-[11px]">Pending</span>
                  </div>
                  <span className="font-semibold text-[#1E293B] mt-0.5">{pendingCount} ({pendingPct}%)</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span className="text-[#64748B] text-[11px]">Suspended</span>
                  </div>
                  <span className="font-semibold text-[#1E293B] mt-0.5">{suspendedCount} ({suspendedPct}%)</span>
                </div>
              </div>
            </div>

            {/* Widget 2: Recent Activities */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1E293B]">Recent Activities</h3>
              </div>

              {recentAudits && recentAudits.length > 0 ? (
                <div className="space-y-3 text-xs">
                  {recentAudits.slice(0, 5).map((ev, idx) => (
                    <div key={ev.id || idx} className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#0F766E] mt-1.5 shrink-0"></span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1E293B] truncate">{ev.action}</p>
                        {ev.notes && <p className="text-[11px] text-[#64748B] truncate">{ev.notes}</p>}
                        <p className="text-[10px] text-[#94A3B8]">
                          {ev.created_at ? new Date(ev.created_at).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 px-4 bg-slate-50/50 rounded-lg border border-dashed border-[#E2E8F0]">
                  <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-[#64748B]">No recent audit events recorded</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Lifecycle transitions, transfers, and approvals will appear here.</p>
                </div>
              )}
            </div>

            {/* Widget 3: Agent Onboarding Checklist */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs md:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#1E293B]">Agent Onboarding Checklist</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#1E293B] font-medium">Profile Information</span>
                    <span className="text-[#64748B] font-semibold">{totalAgents > 0 ? `${totalAgents}/${totalAgents}` : '0/0'}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0F766E] rounded-full" style={{ width: totalAgents > 0 ? '100%' : '0%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#1E293B] font-medium">PRC License Submitted</span>
                    <span className="text-[#64748B] font-semibold">
                      {agents.filter(a => a.prc_license_no && a.prc_license_no.trim() !== '' && a.prc_license_no !== 'N/A').length}/{totalAgents}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F766E] rounded-full"
                      style={{
                        width: totalAgents > 0
                          ? `${Math.round((agents.filter(a => a.prc_license_no && a.prc_license_no.trim() !== '' && a.prc_license_no !== 'N/A').length / totalAgents) * 100)}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#1E293B] font-medium">DHSUD Accreditation Submitted</span>
                    <span className="text-[#64748B] font-semibold">
                      {agents.filter(a => a.dhsud_accreditation_no && a.dhsud_accreditation_no.trim() !== '' && a.dhsud_accreditation_no !== 'N/A').length}/{totalAgents}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F766E] rounded-full"
                      style={{
                        width: totalAgents > 0
                          ? `${Math.round((agents.filter(a => a.dhsud_accreditation_no && a.dhsud_accreditation_no.trim() !== '' && a.dhsud_accreditation_no !== 'N/A').length / totalAgents) * 100)}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#1E293B] font-medium">Account Verified</span>
                    <span className="text-[#64748B] font-semibold">{verifiedCount}/{totalAgents}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: totalAgents > 0 ? `${verifiedPct}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

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
            <Link
              to="/broker/agents/invite"
              className="h-10 px-4 bg-[#FF6B6B] hover:bg-[#EE5A5A] text-[#1E293B] rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Invite Agent</span>
            </Link>
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

      {/* Teams Management Tab */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Brokerage Teams</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Organize agents into specialized branches or sales teams for routing and performance tracking.
              </p>
            </div>
            <form onSubmit={handleCreateTeam} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                required
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="New team name (e.g. Luxury BGC)"
                className="h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
              />
              <input
                type="text"
                value={newTeamBranch}
                onChange={(e) => setNewTeamBranch(e.target.value)}
                placeholder="Branch / Location"
                className="h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
              />
              <button
                type="submit"
                disabled={creatingTeam}
                className="h-9 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
              >
                {creatingTeam ? 'Creating...' : '+ Create Team'}
              </button>
            </form>
          </div>

          {teams.length === 0 ? (
            <div className="p-8 text-center bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-lg">
              <p className="text-xs font-semibold text-[#1E293B]">No teams created yet</p>
              <p className="text-[11px] text-[#64748B] mt-1">Create your first team above to group agents by specialty or branch.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((t) => {
                const memberCount = agents.filter(a => a.team_id === t.id || a.team_name === t.name).length;
                return (
                  <div key={t.id} className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#1E293B]">{t.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-[#0F766E] border border-teal-200">
                          {memberCount} {memberCount === 1 ? 'Agent' : 'Agents'}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1">{t.location_branch || 'General Branch'}</p>
                    </div>
                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setTeamFilter(t.id);
                          setActiveTab('roster');
                        }}
                        className="text-[#0F766E] font-semibold hover:underline cursor-pointer"
                      >
                        Filter Roster →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Calendar & Appointments Unified Sub-Tab */}
      {activeTab === 'calendar' && (
        <AgentScheduleCalendar
          role="broker"
          title="Firm-Wide Schedule & Appointment Calendar"
          subtitle="Coordinate agent viewings, online consultations, document signings, and blocked periods across the brokerage."
        />
      )}

      {/* Issue Agent Invitation Modal */}
      <DashboardModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Issue Agent Invitation"
        subtitle="Generate a single-use onboarding token valid for 72 hours and dispatch via email."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] hover:text-[#1E293B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="invite-agent-form"
              disabled={inviteSubmitting}
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
            >
              {inviteSubmitting ? 'Dispatching...' : 'Dispatch Invitation'}
            </button>
          </div>
        }
      >
        <form id="invite-agent-form" onSubmit={handleSendInvite} className="space-y-4">
          {inviteError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              <p>{inviteError}</p>
              {inviteError.toLowerCase().includes('already exists') && (
                <div className="mt-2.5 pt-2 border-t border-red-200 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-red-800">
                    Active pending invite found. Generate fresh 72h onboarding token?
                  </span>
                  <button
                    type="button"
                    onClick={handleReissueInvite}
                    disabled={inviteSubmitting}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    Re-issue Invite
                  </button>
                </div>
              )}
            </div>
          )}
          {inviteSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
              {inviteSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wider mb-1">
              Prospective Agent Email *
            </label>
            <input
              type="email"
              required
              placeholder="agent@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wider mb-1">
              Brokerage / Branch Agency
            </label>
            <input
              type="text"
              value={inviteAgency}
              onChange={(e) => setInviteAgency(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wider mb-1">
              Personalized Welcome Note (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add welcoming instructions or office orientation details..."
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
            />
          </div>

          <div className="pt-2 text-center text-xs text-[#64748B] border-t border-[#E2E8F0]">
            Prefer the complete onboarding wizard?{" "}
            <Link
              to="/broker/agents/invite"
              onClick={() => setInviteModalOpen(false)}
              className="text-[#0F766E] font-semibold hover:underline"
            >
              Open Full Multi-Step Invite Wizard →
            </Link>
          </div>
        </form>
      </DashboardModal>
    </div>
  );
}
