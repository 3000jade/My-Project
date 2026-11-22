import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Calendar, Clock } from 'lucide-react';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import InquiryOverviewShell from '../../../components/inquiries/InquiryOverviewShell';
import { sortInquiriesByDate } from '../../../components/inquiries/InquiryFilterToolbar';
import InquiryConversationPanel from '../../../components/inquiries/InquiryConversationPanel';
import { useToast } from '../../../components/ui';
import { inquiryService } from '../../../services/inquiryService';
import { useAuth } from '../../../context/AuthContext';

export default function AgentInquiries() {
  const navigate = useNavigate();
  let user = null;
  try {
    user = useAuth()?.user || null;
  } catch {
    user = null;
  }
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
    const clientName = inq.client_name || '';
    const propertyTitle = inq.property_title || '';
    const message = inq.last_message || '';
    const matchesSearch =
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      propertyTitle.toLowerCase().includes(search.toLowerCase()) ||
      message.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || (inq.status || '').toUpperCase() === statusFilter.toUpperCase();

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

    return matchesSearch && matchesStatus && matchesTab;
  });

  const sorted = sortInquiriesByDate(filtered, sortBy);

  const columns = [
    {
      header: 'Client',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-on-surface text-sm truncate">{row.client_name}</p>
          <p className="text-xs text-on-surface-variant truncate">{row.client_email}</p>
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
          {row.last_message ? `â€œ${row.last_message}â€` : 'No messages yet'}
        </p>
      ),
    },
    {
      header: 'Date Received',
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
        />
      )}
    />
  );
}
