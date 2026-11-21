import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Calendar, CheckCircle2, Clock } from 'lucide-react';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import InquiryOverviewShell from '../../../components/inquiries/InquiryOverviewShell';
import { sortInquiriesByDate } from '../../../components/inquiries/InquiryFilterToolbar';
import InquiryConversationPanel from '../../../components/inquiries/InquiryConversationPanel';
import { clientUserService } from '../../../services/clientUserService';

export default function ClientInquiries() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await clientUserService.getClientInquiries();
      setInquiries(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || 'Failed to load your inquiries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const filtered = inquiries.filter((inq) => {
    const propTitle = inq.property_title || '';
    const lastMsg = inq.last_message || '';
    const q = searchQuery.toLowerCase();
    const matchesSearch = propTitle.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || (inq.status || '').toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = sortInquiriesByDate(filtered, sortBy);
  const activeCount = inquiries.filter((i) => i.business_status !== 'inactive' && i.status !== 'RESOLVED').length;
  const scheduledCount = inquiries.filter((i) => (i.status || '').toUpperCase() === 'SCHEDULED').length;

  const columns = [
    {
      header: 'Property',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-primary text-sm truncate max-w-[220px]">
            {row.property_title || 'Property Inquiry'}
          </p>
          <p className="text-xs text-on-surface-variant tabular-nums">{row.property_price}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Consultant',
      render: (row) => (
        <span className="text-xs font-medium text-on-surface">
          {row.agent_name || 'Awaiting agent assignment'}
        </span>
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
      header: 'Date Sent',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant tabular-nums">
          <Clock className="size-3.5 shrink-0" />
          <span>{row.created_at || 'Recent'}</span>
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status || 'NEW'} />,
    },
  ];

  return (
    <InquiryOverviewShell
      testId="client-inquiries-portal"
      title="My Inquiries"
      subtitle="Track your property questions, viewing schedules, and open any inquiry to message your agent."
      onRefresh={loadInquiries}
      loading={loading}
      error={error}
      kpis={[
        { title: 'My Inquiries', value: inquiries.length, icon: MessageSquare },
        { title: 'Active Threads', value: activeCount, icon: CheckCircle2 },
        { title: 'Scheduled Viewings', value: scheduledCount, icon: Calendar },
      ]}
      queueTabs={[
        { value: 'ALL', label: 'ALL' },
        { value: 'NEW', label: 'NEW' },
        { value: 'ASSIGNED', label: 'ASSIGNED' },
        { value: 'SCHEDULED', label: 'SCHEDULED' },
        { value: 'RESOLVED', label: 'RESOLVED' },
      ]}
      activeTab={statusFilter}
      onTabChange={setStatusFilter}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by property or message..."
      sortBy={sortBy}
      onSortChange={setSortBy}
      onResetFilters={() => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setSortBy('newest');
      }}
      items={sorted}
      columns={columns}
      basePath="/client/inquiries"
      onOpenItem={(row) => navigate(`/client/inquiries/${row.id}`)}
      renderQuickView={(inq) => (
        <InquiryConversationPanel
          inquiry={inq}
          viewerRole="client"
          propertyLinkTo={inq.property_id ? `/properties/${inq.property_id}` : undefined}
          propertyLinkLabel="View listing"
          readOnlyNotice="Open the full inquiry page to send a follow-up reply."
        />
      )}
    />
  );
}
