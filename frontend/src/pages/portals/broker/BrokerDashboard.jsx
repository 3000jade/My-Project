import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  RotateCw, 
  BarChart3, 
  Users, 
  Plus, 
  ArrowUpRight, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import MetricCard from '../../../components/dashboard/MetricCard';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import PageHeader from '../../../components/dashboard/PageHeader';
import EmptyState from '../../../components/dashboard/EmptyState';
import { dashboardService, computeBrokerFallback } from '../../../services/dashboardService';

export default function BrokerDashboard() {
  const [data, setData] = useState(() => computeBrokerFallback());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await dashboardService.getDashboardSummary({ role: 'broker' });
      setData(summary);
    } catch (err) {
      console.error('[BrokerDashboard] load failed:', err);
      setError('Unable to fetch live firm dashboard metrics. Displaying offline snapshot.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const metrics = data?.metrics || {};
  const salesSummary = data?.salesSummary || {};
  const agentOverview = data?.agentOverview || [];
  const recentActivity = data?.recentActivity || [];

  const totalProperties = metrics.totalProperties || 0;
  const availableProperties = metrics.availableProperties || 0;
  const reservedProperties = metrics.reservedProperties || 0;
  const soldProperties = metrics.soldProperties || 0;

  const totalInquiries = metrics.totalInquiries || 0;
  const newInquiries = metrics.newInquiries || 0;
  const unresolvedInquiries = metrics.unresolvedInquiries || 0;

  const upcomingAppointments = metrics.upcomingAppointments || 0;

  const totalAgents = metrics.totalAgents || 0;
  const pendingAgentVerification = metrics.pendingAgentVerification || 0;

  const totalSalesValue = salesSummary.totalSalesValue || metrics.totalSalesValue || 0;
  const closedCount = salesSummary.closedCount || 0;
  const recentSales = salesSummary.recentSales || [];

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Header with Modern SaaS Action Bar */}
      <PageHeader
        title="Dashboard"
        subtitle="Consolidated real estate firm monitoring, agent performance metrics, and sales audit trail."
        actions={
          <div className="flex items-center flex-wrap gap-2.5">
            <Button
              onClick={loadDashboard}
              disabled={loading}
              variant="outline"
              size="default"
              className="gap-2"
              aria-label="Refresh dashboard data"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Refresh</span>
            </Button>

            <Button asChild variant="outline" size="default">
              <Link to="/broker/reports" className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#64748B]" />
                <span>Reports &amp; Audit</span>
              </Link>
            </Button>

            <Button asChild variant="coral" size="default">
              <Link to="/broker/properties/select-type" className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#1E293B]" />
                <span>Add Listing</span>
              </Link>
            </Button>

            <Button asChild variant="default" size="default">
              <Link to="/broker/agents" className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-white" />
                <span>Manage Agents</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-amber-800 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
            <span className="font-medium">{error}</span>
          </div>
          <Button
            onClick={loadDashboard}
            variant="outline"
            size="sm"
            className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100/50"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 2. Firm-Wide Key Metrics - Categorized Executive Layout */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Firm-Wide Key Metrics
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#64748B]">
            Real-Time Operational Pulse
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <MetricCard
            title="Total Properties"
            value={totalProperties}
            icon="apartment"
            subtitle="Firm portfolio"
          />
          <MetricCard
            title="Available"
            value={availableProperties}
            icon="check_circle"
            subtitle="Active inventory"
          />
          <MetricCard
            title="Reserved"
            value={reservedProperties}
            icon="bookmark"
            subtitle="Earnest deposit holds"
          />
          <MetricCard
            title="Sold Properties"
            value={soldProperties}
            icon="verified"
            subtitle="Conveyed titles"
          />
          <MetricCard
            title="Total Inquiries"
            value={totalInquiries}
            icon="mail"
            subtitle="Firm inbound leads"
          />
          <MetricCard
            title="New Inquiries"
            value={newInquiries}
            icon="mark_email_unread"
            accent={newInquiries > 0}
            subtitle="Pending triage"
          />
          <MetricCard
            title="Unresolved Inquiries"
            value={unresolvedInquiries}
            icon="pending_actions"
            subtitle="Active negotiation"
          />
          <MetricCard
            title="Upcoming Tours"
            value={upcomingAppointments}
            icon="calendar_month"
            subtitle="Scheduled viewings"
          />
          <MetricCard
            title="Total Agents"
            value={totalAgents}
            icon="badge"
            subtitle="Registered consultants"
          />
          <MetricCard
            title="Pending Verification"
            value={pendingAgentVerification}
            icon="verified_user"
            accent={pendingAgentVerification > 0}
            subtitle="PRC/DHSUD reviews"
          />
        </div>
      </div>

      {/* 3. Sales Monitoring & Recorded Valuations */}
      <Card className="border border-[#E2E8F0] shadow-xs">
        <CardHeader className="border-b border-[#E2E8F0] pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <Badge variant="default" className="mb-2">
                Firm-Wide Sales Audit
              </Badge>
              <CardTitle className="text-xl font-bold text-[#1E293B]">
                Sales Monitoring &amp; Recorded Valuations
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B] mt-1">
                Real estate transaction registry across all licensed consultants.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-6 bg-[#F8FAFC] border border-[#E2E8F0] px-6 py-4 rounded-lg">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Total Closed Valuation
                </p>
                <p className="text-2xl sm:text-3xl font-bold font-mono text-[#1E293B]">
                  {`₱${(totalSalesValue / 1000000).toFixed(1)}M`}
                </p>
              </div>
              <div className="w-px h-10 bg-[#E2E8F0] hidden sm:block" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Number of Closed Sales
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-[#0F766E]">
                  {`${closedCount} Deals`}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex ml-auto">
                <Link to="/broker/sales" className="flex items-center gap-1 text-[11px]">
                  <span>Full Ledger</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {recentSales.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon="receipt_long"
                title="No Conveyancing Records Yet"
                description="Recorded property transactions and closed escrow contracts will appear in this audit trail."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link to="/broker/properties">View Property Portfolio</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Handling Agent</TableHead>
                  <TableHead>Sale Date</TableHead>
                  <TableHead>Property Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-[#F8FAFC]">
                    <TableCell className="font-semibold text-[#1E293B]">
                      {sale.property_title}
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {sale.client_name}
                    </TableCell>
                    <TableCell className="font-medium text-[#1E293B]">
                      {sale.agent_name}
                    </TableCell>
                    <TableCell className="text-xs text-[#64748B] font-mono">
                      {sale.sale_date}
                    </TableCell>
                    <TableCell className="font-bold text-[#0F766E] font-mono">
                      {`₱${(sale.property_value || 0).toLocaleString()}`}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sale.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 4. Agent Performance & Caseload Overview */}
      <Card className="border border-[#E2E8F0] shadow-xs">
        <CardHeader className="border-b border-[#E2E8F0] pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-[#1E293B]">
                Agent Performance &amp; Caseload Overview
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B] mt-0.5">
                Monitoring active listings, inquiries, appointments, and sales milestones.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/broker/agents" className="flex items-center gap-1.5 text-[11px] text-[#0F766E]">
                <span>All Agents Directory</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {agentOverview.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon="group"
                title="No Agents Registered"
                description="Invite licensed property consultants to assign listings and track inquiries."
                action={
                  <Button asChild variant="coral" size="sm">
                    <Link to="/broker/agents/invite">Invite New Consultant</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consultant</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Assigned Properties</TableHead>
                  <TableHead>Active Inquiries</TableHead>
                  <TableHead>Upcoming Tours</TableHead>
                  <TableHead>Recorded Sales</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentOverview.map((ag) => (
                  <TableRow key={ag.id} className="hover:bg-[#F8FAFC]">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={ag.avatar}
                          alt={ag.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0] bg-slate-100"
                        />
                        <div>
                          <p className="font-semibold text-[#1E293B] text-xs sm:text-sm">{ag.name}</p>
                          <p className="text-[11px] text-[#64748B]">{ag.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ag.verification_status} />
                    </TableCell>
                    <TableCell className="font-medium text-[#1E293B] text-xs sm:text-sm">
                      {ag.assigned_properties_count} Properties
                    </TableCell>
                    <TableCell className="font-medium text-[#1E293B] text-xs sm:text-sm">
                      {ag.active_inquiries_count} Inquiries
                    </TableCell>
                    <TableCell className="font-medium text-[#1E293B] text-xs sm:text-sm">
                      {ag.upcoming_appointments_count} Tours
                    </TableCell>
                    <TableCell className="font-bold text-[#0F766E] font-mono text-xs sm:text-sm">
                      {`${ag.recorded_sales_count} Deals (₱${((ag.total_sales_value || 0) / 1000000).toFixed(0)}M)`}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm" className="h-[30px] px-3 text-[11px] text-[#0F766E] hover:bg-[#0F766E] hover:text-white">
                        <Link to={`/broker/agents/${ag.id}`}>
                          Review
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 5. Firm-Wide Operations Activity Log */}
      <Card className="border border-[#E2E8F0] shadow-xs">
        <CardHeader className="pb-4 flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-[#1E293B]">
              Firm-Wide Operations Activity Log
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Audit history of inbound inquiries, tour bookings, and consultant assignments.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs text-[#0F766E] border-[#E2E8F0] hover:bg-[#F8FAFC]">
            <Link to="/broker/audit">
              <span>Full Audit Trail</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-xs text-[#64748B] italic py-4 text-center">
              No recent activity logged in the past 24 hours.
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3.5 text-sm p-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-[#E2E8F0]"
                >
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0F766E] border border-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[19px]">{act.icon}</span>
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="font-semibold text-[#1E293B]">{act.action}</span>
                      <span className="text-[#64748B]"> — {act.user_name} regarding </span>
                      <span className="font-medium text-[#1E293B]">{act.target}</span>
                    </div>
                    <span className="text-xs text-[#64748B] shrink-0 font-mono">
                      {act.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
