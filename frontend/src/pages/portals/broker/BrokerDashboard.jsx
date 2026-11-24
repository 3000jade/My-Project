import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  BarChart3,
  Users,
  Plus,
  ArrowUpRight,
  Banknote,
  Mail,
  CalendarCheck,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import KpiCard from '@/components/ui/cards/KpiCard';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import PageHeader from '../../../components/dashboard/PageHeader';
import EmptyState from '../../../components/dashboard/EmptyState';
import { MetricCardsSkeleton, TableSkeleton } from '../../../components/dashboard/skeletons';
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
    <div className="flex flex-col gap-6 font-sans min-w-0 max-w-full">
      {/* 1. Header & Primary Actions */}
      <PageHeader
        title="Dashboard"
        subtitle="Real-time overview of closed sales, property inventory, client leads, and team activity."
        actions={
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
            <Button
              onClick={loadDashboard}
              disabled={loading}
              variant="outline"
              size="default"
              className="gap-2 flex-1 sm:flex-none justify-center"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>

            <Button asChild variant="outline" size="default" className="flex-1 sm:flex-none justify-center">
              <Link to="/broker/reports" className="flex items-center gap-1.5 whitespace-nowrap">
                <BarChart3 className="size-4 text-[#64748B]" />
                <span>Reports &amp; Audit</span>
              </Link>
            </Button>

            <Button asChild variant="coral" size="default" className="flex-1 sm:flex-none justify-center">
              <Link to="/broker/properties/create" className="flex items-center gap-1.5 whitespace-nowrap">
                <Plus className="size-4 text-[#1E293B]" />
                <span>Add Listing</span>
              </Link>
            </Button>

            <Button asChild variant="default" size="default" className="flex-1 sm:flex-none justify-center">
              <Link to="/broker/agents" className="flex items-center gap-1.5 whitespace-nowrap">
                <Users className="size-4 text-white" />
                <span>Manage Agents</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* Error Alert Banner */}
      {error && (
        <Alert variant="warning" className="flex items-center justify-between gap-4">
          <AlertTriangle className="size-4" />
          <div className="flex-1">
            <AlertTitle className="text-xs font-bold">Offline Snapshot</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
          <Button onClick={loadDashboard} variant="outline" size="sm" className="shrink-0">
            Retry
          </Button>
        </Alert>
      )}

      {loading ? (
        <div className="flex flex-col gap-6" role="status" aria-busy="true" aria-label="Loading broker dashboard...">
          <MetricCardsSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <TableSkeleton rows={5} />
            </div>
            <div className="lg:col-span-4">
              <TableSkeleton rows={4} hasToolbar={false} />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Executive Summary Number Cards (Sales, Listings, Leads, Team) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              variant="trend"
              statusVariant="primary"
              title="Closed Sales"
              value={`₱${(totalSalesValue / 1000000).toFixed(1)}M`}
              icon={Banknote}
              trend={`${closedCount} deals`}
              trendDirection="up"
              footerText="Completed conveyances"
              actionSlot={
                <Link
                  to="/broker/sales"
                  className="text-xs font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>View sales ledger</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              }
            />

            <KpiCard
              variant="trend"
              statusVariant="success"
              title="Property Listings"
              value={availableProperties}
              icon={Building2}
              trend={`${totalProperties ? Math.round((availableProperties / totalProperties) * 100) : 0}% active`}
              trendDirection="up"
              footerText={`${reservedProperties} reserved · ${soldProperties} sold`}
              actionSlot={
                <Link
                  to="/broker/properties"
                  className="text-xs font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>Manage listings</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              }
            />

            <KpiCard
              variant="trend"
              title="Leads & Inquiries"
              value={totalInquiries}
              icon={Mail}
              statusLabel={newInquiries > 0 ? `${newInquiries} New` : undefined}
              statusVariant="coral"
              footerText={`${unresolvedInquiries} open · ${upcomingAppointments} upcoming tours`}
              actionSlot={
                <Link
                  to="/broker/inquiries"
                  className="text-xs font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>Open inquiry inbox</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              }
            />

            <KpiCard
              variant="trend"
              title="Sales Team"
              value={totalAgents}
              icon={Users}
              statusLabel={pendingAgentVerification > 0 ? `${pendingAgentVerification} Pending` : undefined}
              statusVariant="warning"
              footerText="Registered property consultants"
              actionSlot={
                <Link
                  to="/broker/agents"
                  className="text-xs font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>Review agent roster</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              }
            />
          </div>

          {/* 3. Main Operations Grid: Tabbed Sales/Agents (Left 8) + Attention/Activity (Right 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Tabbed Ledger */}
            <Card className="lg:col-span-8">
              <Tabs defaultValue="sales">
                <CardHeader className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle>Firm Operations</CardTitle>
                    <CardDescription>
                      Switch between recent closed sales and your team&apos;s current workload.
                    </CardDescription>
                  </div>
                  <TabsList>
                    <TabsTrigger value="sales">
                      Closed Sales ({closedCount})
                    </TabsTrigger>
                    <TabsTrigger value="agents">
                      Agents ({agentOverview.length})
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <TabsContent value="sales" className="mt-0">
                  <CardContent className="p-0">
                    {recentSales.length === 0 ? (
                      <div className="p-8">
                        <EmptyState
                          icon="receipt_long"
                          title="No Closed Sales Yet"
                          description="Completed property sales will appear here once recorded."
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
                            <TableHead>Agent</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Value</TableHead>
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
                              <TableCell className="font-bold text-[#0F766E] font-mono tabular-nums">
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
                </TabsContent>

                <TabsContent value="agents" className="mt-0">
                  <CardContent className="p-0">
                    {agentOverview.length === 0 ? (
                      <div className="p-8">
                        <EmptyState
                          icon="group"
                          title="No Agents Registered"
                          description="Invite sales agents to assign listings and track client inquiries."
                          action={
                            <Button asChild variant="coral" size="sm">
                              <Link to="/broker/agents">Add Agent</Link>
                            </Button>
                          }
                        />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Agent</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Listings</TableHead>
                            <TableHead>Leads</TableHead>
                            <TableHead>Sales</TableHead>
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
                                    className="size-9 rounded-full object-cover border border-[#E2E8F0] bg-slate-100 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-[#1E293B] text-xs sm:text-sm truncate">
                                      {ag.name}
                                    </p>
                                    <p className="text-[11px] text-[#64748B] truncate">{ag.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={ag.verification_status} />
                              </TableCell>
                              <TableCell className="font-mono text-xs text-[#1E293B]">
                                {ag.assigned_properties_count}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-[#1E293B]">
                                {ag.active_inquiries_count}
                              </TableCell>
                              <TableCell className="font-bold text-[#0F766E] font-mono text-xs tabular-nums">
                                {`${ag.recorded_sales_count} (₱${((ag.total_sales_value || 0) / 1000000).toFixed(0)}M)`}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                  <Link to={`/broker/agents/${ag.id}`}>Review</Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Right 4 Columns: Needs Attention + Activity Feed */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Needs Attention */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Needs Attention</CardTitle>
                  <CardDescription>Items waiting for your review or follow-up.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2.5">
                  <Link
                    to="/broker/agents"
                    className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] hover:border-[#0F766E] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="size-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-semibold text-[#1E293B]">
                        Agent Verifications
                      </span>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {pendingAgentVerification}
                    </Badge>
                  </Link>

                  <Link
                    to="/broker/inquiries"
                    className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] hover:border-[#0F766E] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Mail className="size-4 text-[#0F766E] shrink-0" />
                      <span className="text-xs font-semibold text-[#1E293B]">
                        New Client Inquiries
                      </span>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {newInquiries}
                    </Badge>
                  </Link>

                  <Link
                    to="/broker/appointments"
                    className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] hover:border-[#0F766E] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <CalendarCheck className="size-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-semibold text-[#1E293B]">
                        Upcoming Property Tours
                      </span>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {upcomingAppointments}
                    </Badge>
                  </Link>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                    <CardDescription>Latest firm updates</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/broker/audit" className="text-xs text-[#0F766E]">
                      View All
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <p className="text-xs text-[#64748B] italic py-4 text-center">
                      No recent activity logged in the past 24 hours.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {recentActivity.slice(0, 6).map((act) => (
                        <div
                          key={act.id}
                          className="flex items-start gap-3 text-xs p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors"
                        >
                          <div className="size-8 rounded-md bg-teal-50 text-[#0F766E] border border-teal-100 flex items-center justify-center shrink-0">
                            <Activity className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[#1E293B] font-semibold truncate">{act.action}</p>
                            <p className="text-[#64748B] truncate">
                              {act.user_name} &middot; {act.target}
                            </p>
                            <p className="text-[10px] font-mono text-[#64748B] mt-0.5">
                              {act.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
