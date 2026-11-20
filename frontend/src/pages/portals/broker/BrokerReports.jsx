import React from 'react';
import { Mail, CalendarCheck, Building2, TrendingUp, Award, PieChart } from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import KpiCard from '@/components/ui/cards/KpiCard';
import { mockReportsData } from '../../../mockData/mockReports';

export default function BrokerReports() {
  const {
    salesByDate,
    salesByAgent,
    salesByPropertyType,
    propertyStatusDistribution,
    inquiryActivity,
    appointmentActivity,
  } = mockReportsData;

  const maxVolume = Math.max(...salesByDate.map((d) => d.volume));
  const totalVolume = salesByDate.reduce((acc, item) => acc + (item.volume || 0), 0);

  return (
    <div className="flex flex-col gap-6 font-sans w-full min-w-0 max-w-full" data-testid="broker-reports-portal">
      <PageHeader
        title="Broker Operations & Sales Reports"
        subtitle="Executive analytical summaries across historical closed sales, consultant rankings, and client engagement."
      />

      {/* Top 3-Card Bento KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
        <KpiCard
          data-testid="broker-card"
          variant="breakdown"
          title="Total Firm Inbound Leads"
          value={inquiryActivity.total}
          segments={[
            { label: 'Resolved', value: inquiryActivity.resolved, color: 'primary' },
            { label: 'Active', value: inquiryActivity.assigned, color: 'amber' },
          ]}
        />

        <KpiCard
          data-testid="broker-card"
          variant="trend"
          title="Total Scheduled Showings"
          value={appointmentActivity.total}
          icon={CalendarCheck}
          footerText={`${appointmentActivity.confirmed} confirmed · ${appointmentActivity.completed} completed`}
        />

        <KpiCard
          data-testid="broker-card"
          variant="breakdown"
          title="Active Firm Properties"
          value={propertyStatusDistribution.AVAILABLE}
          segments={[
            { label: 'Available', value: propertyStatusDistribution.AVAILABLE, color: 'emerald' },
            { label: 'Reserved', value: propertyStatusDistribution.RESERVED, color: 'amber' },
            { label: 'Sold', value: propertyStatusDistribution.SOLD, color: 'slate' },
          ]}
        />
      </div>

      {/* Main 8/4 Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Tabbed Volume Trajectory & Agent Ranking */}
        <Card data-testid="broker-card" className="lg:col-span-8 min-w-0">
          <Tabs defaultValue="volume">
            <CardHeader className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-[#0F766E]" />
                  <span>Performance &amp; Valuation Analytics</span>
                </CardTitle>
                <CardDescription>
                  6-Month aggregate volume (₱{(totalVolume / 1000000).toFixed(1)}M) and consultant rankings.
                </CardDescription>
              </div>
              <TabsList>
                <TabsTrigger value="volume">By Period</TabsTrigger>
                <TabsTrigger value="agents">By Agent</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="volume" className="mt-0">
              <CardContent className="pt-6 flex flex-col gap-4">
                {salesByDate.map((item, idx) => {
                  const percentage = Math.round((item.volume / maxVolume) * 100);
                  return (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#1E293B]">{item.period}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#64748B]">{item.count} Transactions</span>
                          <span className="font-bold font-mono tabular-nums text-[#0F766E]">
                            ₱{(item.volume / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#E2E8F0]">
                        <div
                          className="h-full bg-[#0F766E] rounded-full transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                          role="progressbar"
                          aria-valuenow={percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${item.period} sales volume percentage`}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </TabsContent>

            <TabsContent value="agents" className="mt-0">
              <CardContent className="p-0">
                <Table aria-label="Consultant Valuation Ranking">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Deals</TableHead>
                      <TableHead>Listings</TableHead>
                      <TableHead className="text-right">Closed Valuation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesByAgent.map((agent, idx) => (
                      <TableRow key={idx} className="hover:bg-[#F8FAFC]">
                        <TableCell className="font-semibold text-[#1E293B] flex items-center gap-2">
                          <Award className="size-3.5 text-[#0F766E]" />
                          <span>{agent.agent_name}</span>
                        </TableCell>
                        <TableCell className="text-[#64748B] font-mono">{agent.deals}</TableCell>
                        <TableCell className="text-[#64748B] font-mono">{agent.active_listings}</TableCell>
                        <TableCell className="text-right font-bold text-[#0F766E] font-mono tabular-nums">
                          ₱{(agent.volume / 1000000).toFixed(0)}M
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Right 4 Columns: Property Type Distribution + Key Insight */}
        <Card data-testid="broker-card" className="lg:col-span-4 flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="size-4 text-[#0F766E]" />
                <span>By Property Type</span>
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">6-Month</Badge>
            </div>
            <CardDescription>Valuation share across listing categories.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            {salesByPropertyType.map((prop, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#1E293B]">{prop.type}</span>
                  <span className="text-[#64748B] font-mono">
                    {prop.percentage}% &middot; ₱{(prop.volume / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#E2E8F0]">
                  <div
                    className="h-full bg-[#FF6B6B] rounded-full"
                    style={{ width: `${prop.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={prop.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${prop.type} valuation distribution percentage`}
                  />
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="border-t border-[#E2E8F0] pt-4 text-xs text-[#64748B] bg-[#F8FAFC] rounded-b-lg">
            <span>
              <strong className="text-[#1E293B]">Key Insight:</strong> House &amp; Lot estates account for 42% of total transaction valuations, followed by Makati and Taguig penthouses.
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
