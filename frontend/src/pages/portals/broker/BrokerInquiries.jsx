import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Building2, Clock } from 'lucide-react';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import InquiryOverviewShell from '../../../components/inquiries/InquiryOverviewShell';
import { sortInquiriesByDate } from '../../../components/inquiries/InquiryFilterToolbar';
import InquiryConversationPanel from '../../../components/inquiries/InquiryConversationPanel';
import { useToast } from '../../../components/ui';
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
  const [activeTab, setActiveTab] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

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
    if (activeTab === 'ACTIVE') matchesTab = inq.business_status !== 'inactive';
    else if (activeTab === 'INACTIVE') matchesTab = inq.business_status === 'inactive';
    else if (activeTab === 'UNASSIGNED') matchesTab = inq.operational_status === 'unassigned' || !inq.agent_id;
    else if (activeTab === 'OVERDUE') matchesTab = inq.operational_status === 'overdue';

    return matchesSearch && matchesStatus && matchesAgent && matchesTab;
  });

  const sorted = sortInquiriesByDate(filtered, sortBy);

  const columns = [
    {
      header: 'Client & Inbound Date',
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
      header: 'Latest Message',
      render: (row) => (
        <p className="text-xs text-on-surface-variant line-clamp-2 max-w-xs">
          {row.last_message ? `“${row.last_message}”` : 'No messages yet'}
        </p>
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
      onOpenItem={(row) => navigate(`/broker/inquiries/${row.id}`)}
      renderQuickView={(inq) => (
        <InquiryConversationPanel
          inquiry={inq}
          viewerRole="broker"
          propertyLinkTo={`/broker/properties/${inq.property_id}/edit`}
          propertyLinkLabel="Edit property"
          readOnlyNotice="Open the full inquiry page to reassign consultant, view AI summary, or inspect audit logs."
        />
      )}
    />
  );
}
