import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Building2, Clock } from 'lucide-react';
import StatusBadge from '../../../components/dashboard/StatusBadge';
<<<<<<< HEAD
import DataTable from '../../../components/dashboard/DataTable';
import EmptyState from '../../../components/dashboard/EmptyState';
import { Card, CardContent, useToast, Toaster, Spinner } from '../../../components/ui';
import { TableSkeleton } from '../../../components/dashboard/skeletons';
import InquirySourceBadge from '../../../components/inquiries/InquirySourceBadge';
import SlaCountdownPill from '../../../components/inquiries/SlaCountdownPill';
=======
import InquiryOverviewShell from '../../../components/inquiries/InquiryOverviewShell';
import { sortInquiriesByDate } from '../../../components/inquiries/InquiryFilterToolbar';
import InquiryConversationPanel from '../../../components/inquiries/InquiryConversationPanel';
import { useToast } from '../../../components/ui';
>>>>>>> property-tech-v3.0
import { inquiryService } from '../../../services/inquiryService';
import { agentService } from '../../../services/agentService';

export default function BrokerInquiries() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [inquiries, setInquiries] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
<<<<<<< HEAD
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, INACTIVE, UNASSIGNED, UNANSWERED, OVERDUE, AI_CHATBOT
  const [selectedId, setSelectedId] = useState(null);
=======
  const [activeTab, setActiveTab] = useState('ALL');
>>>>>>> property-tech-v3.0
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [sendingReply, setSendingReply] = useState(false);

  const handleSendReply = async (inquiryId, text, attachments = []) => {
    setSendingReply(true);
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticMsg = {
      id: `msg-${Date.now()}`,
      sender: 'broker',
      sender_name: 'Broker Desk',
      timestamp: 'Just now',
      content: text,
      attachments,
      delivery_status: 'sent',
    };

    try {
      await inquiryService.addMessage(inquiryId, text, requestId).catch(() => null);
      setInquiries((prev) =>
        prev.map((inq) =>
          String(inq.id) === String(inquiryId)
            ? {
                ...inq,
                last_message: text,
                messages: [...(inq.messages || []), optimisticMsg],
              }
            : inq
        )
      );
      toast({ title: 'Reply sent', description: 'Your message was added to the conversation.' });
    } finally {
      setSendingReply(false);
    }
  };

  const loadInquiriesAndMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, agentList, met] = await Promise.all([
        inquiryService.getInquiries(),
        agentService.getAgents().catch(() => []),
        typeof inquiryService.getBrokerMetrics === 'function'
          ? inquiryService.getBrokerMetrics().catch(() => null)
          : Promise.resolve(null),
      ]);
      setInquiries(Array.isArray(data) ? data : []);
      setAgents(Array.isArray(agentList) ? agentList : []);
      if (met) setMetrics(met);
    } catch (err) {
      const msg = err.message || 'Failed to load firm inquiries.';
      setError(msg);
      toast({ title: 'Inquiry Sync Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInquiriesAndMetrics();
  }, [loadInquiriesAndMetrics]);

  const totalCount = inquiries.length;
  const newCount = inquiries.filter((i) => (i.status || '').toUpperCase() === 'NEW').length;
  const activeCount = inquiries.filter((i) => i.business_status !== 'inactive').length;
  const inactiveCount = inquiries.filter((i) => i.business_status === 'inactive').length;
  const unassignedCount = inquiries.filter((i) => i.operational_status === 'unassigned' || !i.agent_id).length;
  const overdueCount = inquiries.filter((i) => i.operational_status === 'overdue').length;
  const aiChatbotCount = inquiries.filter((i) => i.source === 'ai_chatbot').length;

  const eligibleAgents = agents.filter(
    (a) => a.verification_status !== 'REJECTED' && a.verification_status !== 'PENDING'
  );

  const handleQuickAssign = async (inquiryId, agentId) => {
    if (!agentId) return;
    const selected = eligibleAgents.find((a) => a.id === agentId);
    try {
      await inquiryService.assignAgent(inquiryId, agentId, 'Quick-assigned by Broker');
      setInquiries((prev) =>
        prev.map((item) =>
          item.id === inquiryId
            ? { ...item, agent_id: agentId, agent_name: selected?.name || selected?.fullName || item.agent_name }
            : item
        )
      );
      toast({
        title: 'Consultant Assigned',
        description: `Assigned to ${selected?.name || selected?.fullName || 'eligible agent'}.`,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Assignment Failed',
        description: err.message || 'Could not assign consultant.',
        variant: 'destructive',
      });
    }
  };

  const avgResponseMinutes =
    metrics?.avgFirstHumanResponseMinutes != null
      ? Math.round(metrics.avgFirstHumanResponseMinutes)
      : metrics?.averageFirstResponseSeconds != null
      ? Math.round(metrics.averageFirstResponseSeconds / 60)
      : 0;

  const filtered = inquiries.filter((inq) => {
    const clientName = inq.client_name || '';
    const propertyTitle = inq.property_title || '';
    const message = inq.last_message || '';
    const matchesSearch =
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      propertyTitle.toLowerCase().includes(search.toLowerCase()) ||
      message.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || (inq.status || '').toUpperCase() === statusFilter.toUpperCase();
    const matchesAgent = agentFilter === 'ALL' || inq.agent_id === agentFilter;

    let matchesTab = true;
<<<<<<< HEAD
    if (activeTab === 'ACTIVE') {
      matchesTab = inq.business_status !== 'inactive';
    } else if (activeTab === 'INACTIVE') {
      matchesTab = inq.business_status === 'inactive';
    } else if (activeTab === 'UNASSIGNED') {
      matchesTab = inq.operational_status === 'unassigned' || !inq.agent_id;
    } else if (activeTab === 'OVERDUE') {
      matchesTab = inq.operational_status === 'overdue';
    } else if (activeTab === 'AI_CHATBOT') {
      matchesTab = inq.source === 'ai_chatbot';
    }
=======
    if (activeTab === 'ACTIVE') matchesTab = inq.business_status !== 'inactive';
    else if (activeTab === 'INACTIVE') matchesTab = inq.business_status === 'inactive';
    else if (activeTab === 'UNASSIGNED') matchesTab = inq.operational_status === 'unassigned' || !inq.agent_id;
    else if (activeTab === 'OVERDUE') matchesTab = inq.operational_status === 'overdue';
>>>>>>> property-tech-v3.0

    return matchesSearch && matchesStatus && matchesAgent && matchesTab;
  });

  const sorted = sortInquiriesByDate(filtered, sortBy);

  const columns = [
    {
<<<<<<< HEAD
      header: "Client & Inbound Date",
      render: (row) => {
        const initials = getInitials(row.client_name);
        const avatarBg = getAvatarColor(row.client_name);
        const isOverdue = row.operational_status === 'overdue';
        const isNew = (row.status || '').toUpperCase() === 'NEW';
        const isUnassigned = row.operational_status === 'unassigned' || !row.agent_id;

        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-1 self-stretch rounded-full shrink-0 ${
                isOverdue
                  ? 'bg-rose-500'
                  : isNew
                  ? 'bg-[#0F766E]'
                  : isUnassigned
                  ? 'bg-amber-400'
                  : 'bg-transparent'
              }`}
            />
            <div className="relative shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${avatarBg}`}
              >
                {initials}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                  isOverdue
                    ? 'bg-rose-500'
                    : isNew
                    ? 'bg-[#0F766E] animate-pulse'
                    : isUnassigned
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                title={
                  isOverdue
                    ? 'Overdue SLA'
                    : isNew
                    ? 'New Inbound'
                    : isUnassigned
                    ? 'Unassigned'
                    : 'Active'
                }
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-bold text-[#1E293B] dark:text-slate-100 font-sans text-xs truncate">
                  {row.client_name}
                </p>
                {isNew && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400 border border-teal-200/60 dark:border-teal-800">
                    New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-sans truncate">
                {row.client_email || row.client_phone || row.created_at}
              </p>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                Ref: {row.reference_code || row.id}
              </span>
              <div className="pt-1">
                <InquirySourceBadge
                  source={row.source}
                  consentAccepted={row.consentAccepted ?? row.consent_accepted}
                />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Latest Message",
=======
      header: 'Client & Inbound Date',
>>>>>>> property-tech-v3.0
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-on-surface text-sm truncate">{row.client_name}</p>
          <p className="text-xs text-on-surface-variant truncate">{row.client_email || row.client_phone}</p>
          <span className="text-[11px] text-on-surface-variant tabular-nums">
            Ref: {row.reference_code || row.id}
          </span>
        </div>
      ),
    },
    {
      header: 'Property Interested',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-primary text-sm truncate max-w-[200px] inline-flex items-center gap-1.5">
            <Building2 className="size-3.5 shrink-0" />
            <span className="truncate">{row.property_title || 'General Inquiry'}</span>
          </p>
          <p className="text-xs text-on-surface-variant tabular-nums">{row.property_price}</p>
        </div>
      ),
    },
    {
<<<<<<< HEAD
      header: "Assigned Consultant",
      render: (row) => {
        const isAssigned = Boolean(row.agent_name);
        return (
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                isAssigned
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
              }`}
            >
              {isAssigned ? getInitials(row.agent_name) : '!'}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-sans truncate">
                {row.agent_name || <span className="text-amber-700 dark:text-amber-400 font-bold">Unassigned</span>}
              </p>
              {eligibleAgents.length > 0 ? (
                <select
                  aria-label={`Quick assign consultant for ${row.client_name}`}
                  value={row.agent_id || ''}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleQuickAssign(row.id, e.target.value);
                  }}
                  className="text-[11px] bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded px-1.5 py-0.5 text-[#1E293B] dark:text-slate-200 focus:border-[#0F766E] outline-none cursor-pointer"
                >
                  <option value="">Assign verified agent...</option>
                  {eligibleAgents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name || a.fullName}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans block">
                  {isAssigned ? 'Consultant' : 'Awaiting routing'}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Operational State",
      render: (row) => (
        <div className="flex flex-col gap-1 items-start">
          <div className="flex items-center gap-1.5 flex-wrap">
            <SlaCountdownPill
              createdAt={row.created_at}
              operationalStatus={row.operational_status}
              businessStatus={row.business_status}
              firstRespondedAt={row.first_responded_at}
            />
            {row.business_status === 'inactive' && (
              <span className="text-[9px] font-mono uppercase text-slate-400">Inactive</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#64748B] dark:text-slate-400 font-mono">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{row.created_at || 'Recent'}</span>
          </div>
        </div>
=======
      header: 'Latest Message',
      render: (row) => (
        <p className="text-xs text-on-surface-variant line-clamp-2 max-w-xs">
          {row.last_message ? `“${row.last_message}”` : 'No messages yet'}
        </p>
>>>>>>> property-tech-v3.0
      ),
    },
    {
      header: 'Assigned Consultant',
      render: (row) => (
        <span className={`text-xs font-medium ${row.agent_name ? 'text-on-surface' : 'text-amber-700 font-semibold'}`}>
          {row.agent_name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Received',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant tabular-nums">
          <Clock className="size-3.5 shrink-0" />
          <span>{row.created_at || 'Recent'}</span>
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
<<<<<<< HEAD
    <div className="space-y-6 max-w-[1440px] mx-auto font-sans" data-testid="broker-inquiries-portal">
      <Toaster />
      <PageHeader
        title="Inquiries"
        subtitle="Monitor incoming client requests, oversee consultant communication, and enforce response SLAs."
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/broker/inquiries/messages"
              className="h-[42px] px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-bold font-sans uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open Messaging Inbox</span>
            </Link>
            <button
              onClick={loadInquiriesAndMetrics}
              disabled={loading}
              aria-label="Refresh firm inquiries"
              className="h-[42px] px-4 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-[#1E293B] dark:text-slate-100 border border-[#E2E8F0] dark:border-slate-800 rounded-lg text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Broker SLA Performance & Queue Metrics Bar (BROKER-01, UX-01) with Card Primitives */}
      <div data-testid="broker-sla-metrics-bar" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-sans">Total Inquiries</p>
            <p className="text-2xl font-bold font-display text-[#1E293B] dark:text-slate-100 mt-1">
              {metrics?.totalInquiries ?? totalCount}
            </p>
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-mono">
              {metrics?.activeCount ?? activeCount} active / {metrics?.inactiveCount ?? inactiveCount} inactive
            </span>
          </CardContent>
        </Card>
        <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] dark:text-teal-400 font-sans">New Inbound</p>
            <p className="text-2xl font-bold font-display text-[#0F766E] dark:text-teal-400 mt-1">{newCount}</p>
            <span className="text-[10px] text-[#0F766E] dark:text-teal-400 font-mono">Unassigned: {metrics?.unassignedCount ?? unassignedCount}</span>
          </CardContent>
        </Card>
        <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-sans">Overdue Escalations</p>
            <p className="text-2xl font-bold font-display text-rose-600 dark:text-rose-400 mt-1">
              {metrics?.overdueCount ?? overdueCount}
            </p>
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-mono">Exceeded 30m response SLA</span>
          </CardContent>
        </Card>
        <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-sans">Avg First Response</p>
            <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics ? `${Math.round(metrics.averageFirstResponseSeconds / 60)}m` : '7m'}
            </p>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
              {metrics?.conversionRatePercent ?? 33}% conversion rate
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center justify-between text-rose-700 dark:text-rose-300 font-sans text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-base">error</span>
            <span>Failed to load firm inquiries: {error}</span>
          </div>
          <button
            onClick={loadInquiriesAndMetrics}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded uppercase tracking-wider hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Queue Tabs */}
      <div data-testid="broker-queue-tabs" className="flex items-center gap-2 border-b border-[#E2E8F0] dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { key: 'ALL', label: `All Inquiries (${totalCount})` },
          { key: 'ACTIVE', label: `Active Pipeline (${activeCount})` },
          { key: 'INACTIVE', label: `Inactive (${inactiveCount})` },
          { key: 'UNASSIGNED', label: `Unassigned (${unassignedCount})` },
          { key: 'OVERDUE', label: `Overdue SLA (${overdueCount})` },
          { key: 'AI_CHATBOT', label: `AI Chatbot (${aiChatbotCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-[#64748B] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-[#E2E8F0] dark:border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SearchAndFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search client name, property, or inquiry snippet..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "ALL" },
              { label: "New", value: "NEW" },
              { label: "Assigned", value: "ASSIGNED" },
              { label: "Resolved", value: "RESOLVED" },
              { label: "Reopened", value: "REOPENED" },
            ]
          },
          {
            value: agentFilter,
            onChange: setAgentFilter,
            options: agentOptions
          }
        ]}
      />

      {loading ? (
        <TableSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No inquiries match your filters"
          description="Try selecting a different tab or clearing keyword filters."
          action={
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setAgentFilter('ALL'); setActiveTab('ALL'); }}
              className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-xs font-bold uppercase tracking-wider font-sans cursor-pointer"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 rounded-lg border border-[#E2E8F0] dark:border-slate-800 overflow-hidden shadow-xs">
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(row) => navigate(`/broker/inquiries/messages/${row.id}`)}
          />
        </Card>
=======
    <InquiryOverviewShell
      testId="broker-inquiries-portal"
      title="Inquiries"
      subtitle="Monitor incoming client requests, oversee consultant communication, and enforce response SLAs."
      onRefresh={loadInquiriesAndMetrics}
      loading={loading}
      error={error ? `Failed to load firm inquiries: ${error}` : null}
      kpiTestId="broker-sla-metrics-bar"
      kpis={[
        {
          'data-testid': 'broker-card',
          title: 'Total Inquiries',
          value: metrics?.totalInquiries ?? totalCount,
          icon: MessageSquare,
        },
        {
          'data-testid': 'broker-card',
          title: 'New Inbound',
          value: newCount,
          statusLabel:
            (metrics?.unassignedCount ?? unassignedCount) > 0
              ? `${metrics?.unassignedCount ?? unassignedCount} Unassigned`
              : 'All Assigned',
          statusVariant: (metrics?.unassignedCount ?? unassignedCount) > 0 ? 'coral' : 'success',
        },
        {
          'data-testid': 'broker-card',
          title: 'Avg First Response',
          value: `${avgResponseMinutes}m`,
          trend:
            metrics?.conversionRatePercent != null
              ? `${metrics.conversionRatePercent}% conv`
              : `${metrics?.overdueCount ?? overdueCount} overdue`,
          trendDirection:
            metrics?.conversionRatePercent != null
              ? 'up'
              : (metrics?.overdueCount ?? overdueCount) > 0
              ? 'down'
              : 'up',
        },
      ]}
      tabsTestId="broker-queue-tabs"
      queueTabs={[
        { value: 'ALL', label: `All (${totalCount})` },
        { value: 'ACTIVE', label: `Active (${activeCount})` },
        { value: 'UNASSIGNED', label: `Unassigned (${unassignedCount})` },
        { value: 'OVERDUE', label: `Overdue SLA (${overdueCount})` },
        { value: 'INACTIVE', label: `Inactive (${inactiveCount})` },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search client name, property, or inquiry snippet..."
      filters={[
        {
          label: 'Status',
          value: statusFilter,
          onChange: setStatusFilter,
          placeholder: 'All Statuses',
          options: [
            { label: 'All Statuses', value: 'ALL' },
            { label: 'New', value: 'NEW' },
            { label: 'Assigned', value: 'ASSIGNED' },
            { label: 'Resolved', value: 'RESOLVED' },
            { label: 'Reopened', value: 'REOPENED' },
          ],
        },
        {
          label: 'Consultant',
          value: agentFilter,
          onChange: setAgentFilter,
          placeholder: 'All Agents',
          options: [
            { label: 'All Agents', value: 'ALL' },
            ...agents.map((a) => ({ label: a.name || a.fullName, value: a.id })),
          ],
        },
      ]}
      sortBy={sortBy}
      onSortChange={setSortBy}
      onResetFilters={() => {
        setSearch('');
        setStatusFilter('ALL');
        setAgentFilter('ALL');
        setActiveTab('ALL');
        setSortBy('newest');
      }}
      items={sorted}
      columns={columns}
      basePath="/broker/inquiries"
      viewerRole="broker"
      onSendReply={handleSendReply}
      sendingReply={sendingReply}
      onOpenItem={(row) => navigate(`/broker/inquiries/${row.id}`)}
      renderQuickView={(inq) => (
        <InquiryConversationPanel
          inquiry={inq}
          viewerRole="broker"
          propertyLinkTo={`/broker/properties/${inq.property_id}/edit`}
          propertyLinkLabel="Edit property"
          readOnlyNotice="Open the full inquiry page to reassign consultant, view AI summary, or inspect audit logs."
        />
>>>>>>> property-tech-v3.0
      )}
    />
  );
}
