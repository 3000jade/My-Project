import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Plus,
  ArrowUpRight,
  Banknote,
  Mail,
  CalendarCheck,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import KpiCard from '@/components/ui/cards/KpiCard';
import {
  Card,
  CardHeader,
  CardTitle,
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

const PREVIEW_LIMIT = 5;

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
      setError('Unable to fetch live dashboard data. Showing offline snapshot.');
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

  const recentSalesPreview = recentSales.slice(0, PREVIEW_LIMIT);
  const agentPreview = agentOverview.slice(0, PREVIEW_LIMIT);

  const actionItems = [
    {
      key: 'verifications',
      label: 'Agent Verifications',
      count: pendingAgentVerification,
      to: '/broker/agents',
      icon: ShieldAlert,
      iconClass: 'text-amber-600',
    },
    {
      key: 'inquiries',
      label: 'New Inquiries',
      count: newInquiries,
      to: '/broker/inquiries',
      icon: Mail,
      iconClass: 'text-[#0F766E]',
    },
    {
      key: 'tours',
      label: 'Upcoming Tours',
      count: upcomingAppointments,
      to: '/broker/inquiries',
      icon: CalendarCheck,
      iconClass: 'text-blue-600',
    },
  ];

  const totalActionCount = actionItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="flex flex-col gap-6 font-sans w-full min-w-0 max-w-full">
      {/* 1. Header & Single Primary Action */}
      <PageHeader
        title="Dashboard"
        actions={
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
            <Button
              onClick={loadDashboard}
              disabled={loading}
              variant="outline"
              size="default"
              className="gap-2 flex-1 sm:flex-none justify-center min-h-11 sm:min-h-0"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} />
              <span>Refresh</span>
            </Button>

            <Button
              asChild
              variant="coral"
              size="default"
              className="flex-1 sm:flex-none justify-center min-h-11 sm:min-h-0"
            >
              <Link to="/broker/properties/create" className="flex items-center gap-2 whitespace-nowrap text-white">
                <Plus className="size-4 text-white" />
                <span>Add Listing</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* Error Alert Banner */}
      {error && (
        <Alert variant="warning" className="flex items-center justify-between gap-4">
          <AlertTriangle className="size-4" />
          <div className="flex-1 min-w-0">
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
            <div className="lg:col-span-8 min-w-0">
              <TableSkeleton rows={5} />
            </div>
            <div className="lg:col-span-4 min-w-0">
              <TableSkeleton rows={3} hasToolbar={false} />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Top Summary Numbers (Non-duplicated) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              variant="trend"
              statusVariant="primary"
              title="Closed Sales"
              value={`₱${(totalSalesValue / 1000000).toFixed(1)}M`}
              icon={Banknote}
              trend={`${closedCount} deals`}
              trendDirection="up"
              footerText="Completed sales"
              actionSlot={
                <Link
                  to="/broker/sales"
                  className="text-xs font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>View sales</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              }
            />

            <KpiCard
              variant="trend"
              statusVariant="success"
              title="Active Listings"
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
                  <span>View listings</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              }
            />

            <KpiCard
              variant="trend"
              statusVariant="primary"
              title="Open Inquiries"
              value={unresolvedInquiries}
              icon={Mail}
              footerText={`${totalInquiries} total inquiries`}
              actionSlot={
                <Link
                  to="/broker/inquiries"
                  className="text-xs font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>Open inbox</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              }
            />

            <KpiCard
              variant="trend"
              statusVariant="primary"
              title="Sales Team"
              value={totalAgents}
              icon={Users}
              footerText="Registered agents"
              actionSlot={
                <Link
                  to="/broker/agents"
                  className="text-xs font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>View team</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              }
            />
          </div>

          {/* 3. Main Area: Compact Preview Table (Left 8) + Needs Action (Right 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Top 5 Preview Table */}
            <Card className="lg:col-span-8 min-w-0">
              <Tabs defaultValue="sales">
                <CardHeader className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-base">Overview</CardTitle>
                  <TabsList>
                    <TabsTrigger value="sales">
                      Recent Sales ({closedCount})
                    </TabsTrigger>
                    <TabsTrigger value="agents">
                      Team ({agentOverview.length})
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <TabsContent value="sales" className="mt-0">
                  <CardContent className="p-0 overflow-x-auto">
                    {recentSalesPreview.length === 0 ? (
                      <div className="p-8">
                        <EmptyState
                          icon="receipt_long"
                          title="No Closed Sales Yet"
                          description="Completed property sales will appear here once recorded."
                          action={
                            <Button asChild variant="outline" size="sm">
                              <Link to="/broker/properties">View Listings</Link>
                            </Button>
                          }
                        />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Property</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentSalesPreview.map((sale) => (
                            <TableRow key={sale.id} className="hover:bg-[#F8FAFC]">
                              <TableCell>
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#1E293B] truncate">
                                    {sale.property_title}
                                  </p>
                                  <p className="text-xs text-[#64748B] truncate">
                                    {sale.client_name}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-[#1E293B]">
                                {sale.agent_name}
                              </TableCell>
                              <TableCell className="font-semibold text-[#0F766E] font-sans tabular-nums">
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
                  {recentSales.length > 0 && (
                    <CardFooter className="border-t border-[#E2E8F0] px-4 py-4 flex items-center justify-between gap-2 text-xs text-[#64748B]">
                      <span>
                        Showing {recentSalesPreview.length} of {recentSales.length} recent sales
                      </span>
                      <Link
                        to="/broker/sales"
                        className="font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        <span>View all sales</span>
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </CardFooter>
                  )}
                </TabsContent>

                <TabsContent value="agents" className="mt-0">
                  <CardContent className="p-0 overflow-x-auto">
                    {agentPreview.length === 0 ? (
                      <div className="p-8">
                        <EmptyState
                          icon="group"
                          title="No Agents Yet"
                          description="Invite sales agents to assign listings and track client inquiries."
                          action={
                            <Button asChild variant="outline" size="sm">
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
                            <TableHead>Listings</TableHead>
                            <TableHead>Leads</TableHead>
                            <TableHead>Sales</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {agentPreview.map((ag) => (
                            <TableRow key={ag.id} className="hover:bg-[#F8FAFC]">
                              <TableCell>
                                <div className="flex items-center gap-2 min-w-0">
                                  <img
                                    src={ag.avatar}
                                    alt={ag.name}
                                    className="size-8 rounded-full object-cover border border-[#E2E8F0] bg-slate-100 shrink-0"
                                  />
                                  <span className="font-semibold text-[#1E293B] text-sm truncate">
                                    {ag.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-[#1E293B] font-sans tabular-nums">
                                {ag.assigned_properties_count}
                              </TableCell>
                              <TableCell className="text-sm text-[#1E293B] font-sans tabular-nums">
                                {ag.active_inquiries_count}
                              </TableCell>
                              <TableCell className="font-semibold text-[#0F766E] text-sm font-sans tabular-nums">
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
                  {agentOverview.length > 0 && (
                    <CardFooter className="border-t border-[#E2E8F0] px-4 py-4 flex items-center justify-between gap-2 text-xs text-[#64748B]">
                      <span>
                        Showing {agentPreview.length} of {agentOverview.length} agents
                      </span>
                      <Link
                        to="/broker/agents"
                        className="font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        <span>View all agents</span>
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </CardFooter>
                  )}
                </TabsContent>
              </Tabs>
            </Card>

            {/* Right 4 Columns: Single Needs Action Card */}
            <Card className="lg:col-span-4 min-w-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Needs Action</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {totalActionCount === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-6 px-4 text-center rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <CheckCircle2 className="size-6 text-emerald-600" />
                    <p className="text-sm font-semibold text-[#1E293B]">All caught up</p>
                    <p className="text-xs text-[#64748B]">
                      Nothing is waiting for your review right now.
                    </p>
                  </div>
                ) : (
                  actionItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.key}
                        to={item.to}
                        className="flex items-center justify-between min-h-11 px-4 py-2 rounded-lg border border-[#E2E8F0] hover:border-[#0F766E] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={`size-4 shrink-0 ${item.iconClass}`} />
                          <span className="text-sm font-medium text-[#1E293B] truncate">
                            {item.label}
                          </span>
                        </div>
                        <Badge variant="outline" className="font-sans tabular-nums shrink-0">
                          {item.count}
                        </Badge>
                      </Link>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
