import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Calendar, Clock } from 'lucide-react';
import StatusBadge from '../../../components/dashboard/StatusBadge';
<<<<<<< HEAD
import DataTable from '../../../components/dashboard/DataTable';
import EmptyState from '../../../components/dashboard/EmptyState';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui';
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
import { useAuth } from '../../../context/AuthContext';

export default function AgentInquiries() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const effectiveAgentId = user?.id || 'agent-1';

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [sendingReply, setSendingReply] = useState(false);

  const handleSendReply = async (inquiryId, text, attachments = []) => {
    setSendingReply(true);
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticMsg = {
      id: `msg-${Date.now()}`,
      sender: 'agent',
      sender_name: user?.name || 'Assigned Consultant',
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

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inquiryService.getInquiries({ agentId: effectiveAgentId });
      setInquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.message || 'Failed to retrieve inquiries.';
      setError(msg);
      toast({ title: 'Inquiry Sync Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [effectiveAgentId, toast]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const totalCount = inquiries.length;
<<<<<<< HEAD
  const awaitingCount = inquiries.filter(
    (inq) => inq.operational_status === 'awaiting_agent' || (inq.status || '').toUpperCase() === 'NEW'
  ).length;
  const overdueCount = inquiries.filter((inq) => inq.operational_status === 'overdue').length;
  const aiChatbotCount = inquiries.filter((inq) => inq.source === 'ai_chatbot').length;

  const filtered = inquiries.filter(inq => {
=======
  const activeCount = inquiries.filter((i) => i.business_status !== 'inactive').length;
  const inactiveCount = inquiries.filter((i) => i.business_status === 'inactive').length;
  const needsReplyCount = inquiries.filter(
    (i) =>
      i.business_status !== 'inactive' &&
      ((i.status || '').toUpperCase() === 'NEW' ||
        (i.status || '').toUpperCase() === 'REOPENED' ||
        i.operational_status === 'awaiting_agent' ||
        i.operational_status === 'overdue')
  ).length;
  const scheduledCount = inquiries.filter((i) => (i.status || '').toUpperCase() === 'SCHEDULED').length;

  const filtered = inquiries.filter((inq) => {
>>>>>>> property-tech-v3.0
    const clientName = inq.client_name || '';
    const propertyTitle = inq.property_title || '';
    const message = inq.last_message || '';
    const matchesSearch =
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      propertyTitle.toLowerCase().includes(search.toLowerCase()) ||
      message.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || (inq.status || '').toUpperCase() === statusFilter.toUpperCase();
<<<<<<< HEAD
    let matchesTab = true;
    if (activeTab === 'AWAITING_AGENT') {
      matchesTab = inq.operational_status === 'awaiting_agent' || (inq.status || '').toUpperCase() === 'NEW';
    } else if (activeTab === 'OVERDUE') {
      matchesTab = inq.operational_status === 'overdue';
    } else if (activeTab === 'AI_CHATBOT') {
      matchesTab = inq.source === 'ai_chatbot';
    }
=======

    let matchesTab = true;
    if (activeTab === 'ACTIVE') matchesTab = inq.business_status !== 'inactive';
    else if (activeTab === 'INACTIVE') matchesTab = inq.business_status === 'inactive';
    else if (activeTab === 'NEEDS_REPLY') {
      matchesTab =
        inq.business_status !== 'inactive' &&
        ((inq.status || '').toUpperCase() === 'NEW' ||
          (inq.status || '').toUpperCase() === 'REOPENED' ||
          inq.operational_status === 'awaiting_agent' ||
          inq.operational_status === 'overdue');
    }

>>>>>>> property-tech-v3.0
    return matchesSearch && matchesStatus && matchesTab;
  });

  const sorted = sortInquiriesByDate(filtered, sortBy);

  const columns = [
    {
      header: 'Client',
      render: (row) => (
<<<<<<< HEAD
        <div className="space-y-1">
          <p className="font-bold text-[#1E293B] font-sans">{row.client_name}</p>
          <p className="text-xs text-[#64748B] font-sans">{row.client_email}</p>
          <InquirySourceBadge
            source={row.source}
            consentAccepted={row.consentAccepted ?? row.consent_accepted}
          />
=======
        <div className="min-w-0">
          <p className="font-semibold text-on-surface text-sm truncate">{row.client_name}</p>
          <p className="text-xs text-on-surface-variant truncate">{row.client_email}</p>
>>>>>>> property-tech-v3.0
        </div>
      ),
    },
    {
      header: 'Property Interested',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-primary text-sm truncate max-w-[220px]">
            {row.property_title}
          </p>
          <p className="text-xs text-on-surface-variant tabular-nums">{row.property_price}</p>
        </div>
      ),
    },
    {
      header: 'Last Message',
      render: (row) => (
        <p className="text-xs text-on-surface-variant line-clamp-2 max-w-xs">
          {row.last_message ? `“${row.last_message}”` : 'No messages yet'}
        </p>
      ),
    },
    {
<<<<<<< HEAD
      header: "Date Received",
      accessor: "created_at"
    },
    {
      header: "Status & SLA",
      render: (row) => (
        <div className="flex flex-col items-start gap-1.5">
          <StatusBadge status={row.status} />
          <SlaCountdownPill
            createdAt={row.created_at}
            operationalStatus={row.operational_status}
            businessStatus={row.business_status}
            firstRespondedAt={row.first_responded_at}
          />
        </div>
      )
    },
    {
      header: "Actions",
      className: "text-right",
=======
      header: 'Date Received',
>>>>>>> property-tech-v3.0
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

  const agentTabs = [
    { key: 'ALL', label: `All (${totalCount})` },
    { key: 'AWAITING_AGENT', label: `Unanswered (${awaitingCount})` },
    { key: 'OVERDUE', label: `Overdue SLA (${overdueCount})` },
    { key: 'AI_CHATBOT', label: `AI Chatbot Leads (${aiChatbotCount})` },
  ];

  return (
<<<<<<< HEAD
    <div className="space-y-6">
      <PageHeader
        title="Inquiry Dashboard"
        subtitle="Monitor assigned leads, response SLAs, and jump into live client conversations."
        breadcrumbs={[
          { label: "Dashboard", to: "/agent/dashboard" },
          { label: "Inquiries" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/agent/inquiries/messages"
              className="h-[46px] px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open Messaging Inbox</span>
            </Link>
            <button
              onClick={loadInquiries}
              disabled={loading}
              className="h-[46px] px-4 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 font-sans text-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>Failed to load inquiries: {error}</span>
          </div>
          <button
            onClick={loadInquiries}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Agent KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-[#E2E8F0] shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] font-sans">Assigned Total</p>
            <p className="text-2xl font-bold font-display text-[#1E293B] mt-1">{totalCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-[#E2E8F0] shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] font-sans">Awaiting Reply</p>
            <p className="text-2xl font-bold font-display text-[#0F766E] mt-1">{awaitingCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-[#E2E8F0] shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 font-sans">Overdue SLA</p>
            <p className="text-2xl font-bold font-display text-rose-600 mt-1">{overdueCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-[#E2E8F0] shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] font-sans">AI Chatbot Leads</p>
            <p className="text-2xl font-bold font-display text-[#1E293B] mt-1">{aiChatbotCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 overflow-x-auto">
        {agentTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'bg-white text-[#64748B] hover:bg-slate-50 border border-[#E2E8F0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SearchAndFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search client name, property, or inquiry keywords..."
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
          }
        ]}
      />

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No inquiries match your criteria"
          description="Try clearing your search or switching to another status filter."
          action={
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setActiveTab('ALL'); }}
              className="px-4 py-2 bg-[#0F766E] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer hover:bg-[#115E59] transition-colors"
            >
              Show All Inquiries
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/agent/inquiries/messages/${row.id}`)}
=======
    <InquiryOverviewShell
      testId="agent-inquiries-portal"
      title="Assigned Inquiries"
      subtitle="Triage client questions, preview threads, and open any inquiry for full action."
      breadcrumbs={[
        { label: 'Dashboard', to: '/agent/dashboard' },
        { label: 'Inquiries' },
      ]}
      onRefresh={loadInquiries}
      loading={loading}
      error={error ? `Failed to load inquiries: ${error}` : null}
      kpis={[
        { title: 'Assigned Inquiries', value: totalCount, icon: MessageSquare },
        {
          title: 'Needs Attention',
          value: needsReplyCount,
          statusLabel: needsReplyCount > 0 ? `${needsReplyCount} Open` : 'Caught Up',
          statusVariant: needsReplyCount > 0 ? 'coral' : 'success',
        },
        { title: 'Scheduled Viewings', value: scheduledCount, icon: Calendar },
      ]}
      queueTabs={[
        { value: 'ALL', label: `All (${totalCount})` },
        { value: 'NEEDS_REPLY', label: `Needs Reply (${needsReplyCount})` },
        { value: 'ACTIVE', label: `Active (${activeCount})` },
        { value: 'INACTIVE', label: `Inactive (${inactiveCount})` },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search client name, property, or keywords..."
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
            { label: 'Scheduled', value: 'SCHEDULED' },
            { label: 'Resolved', value: 'RESOLVED' },
            { label: 'Reopened', value: 'REOPENED' },
          ],
        },
      ]}
      sortBy={sortBy}
      onSortChange={setSortBy}
      onResetFilters={() => {
        setSearch('');
        setStatusFilter('ALL');
        setActiveTab('ALL');
        setSortBy('newest');
      }}
      items={sorted}
      columns={columns}
      basePath="/agent/inquiries"
      viewerRole="agent"
      onSendReply={handleSendReply}
      sendingReply={sendingReply}
      onOpenItem={(row) => navigate(`/agent/inquiries/${row.id}`)}
      renderQuickView={(inq) => (
        <InquiryConversationPanel
          inquiry={inq}
          viewerRole="agent"
          propertyLinkTo={`/agent/properties/${inq.property_id}`}
          propertyLinkLabel="View property"
          readOnlyNotice="Open the full inquiry page to reply, schedule viewings, or update tasks."
>>>>>>> property-tech-v3.0
        />
      )}
    />
  );
}
