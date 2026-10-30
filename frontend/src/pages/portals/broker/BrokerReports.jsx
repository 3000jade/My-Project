import React from 'react';
import PageHeader from '../../../components/dashboard/PageHeader';
import MetricCard from '../../../components/dashboard/MetricCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui';
import { mockReportsData } from '../../../mockData/mockReports';

export default function BrokerReports() {
  const {
    salesByDate,
    salesByAgent,
    salesByPropertyType,
    propertyStatusDistribution,
    inquiryActivity,
    appointmentActivity
  } = mockReportsData;

  const maxVolume = Math.max(...salesByDate.map(d => d.volume));

  return (
    <div className="space-y-8 font-sans max-w-[1440px] mx-auto min-w-0 max-w-full" data-testid="broker-reports-portal">
      <PageHeader
        title="Broker Operations & Sales Reports"
        subtitle="Executive analytical summaries across historical closed sales, consultant rankings, and client engagement."
      />

      {/* High-level Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0 max-w-full">
        <MetricCard
          title="Total Firm Inbound Leads"
          value={inquiryActivity.total}
          icon="mark_email_read"
          subtitle={`${inquiryActivity.resolved} resolved • ${inquiryActivity.assigned} active`}
        />
        <MetricCard
          title="Total Scheduled Showings"
          value={appointmentActivity.total}
          icon="calendar_month"
          subtitle={`${appointmentActivity.confirmed} confirmed • ${appointmentActivity.completed} completed`}
        />
        <MetricCard
          title="Active Firm Properties"
          value={propertyStatusDistribution.AVAILABLE}
          icon="apartment"
          subtitle={`${propertyStatusDistribution.RESERVED} reserved • ${propertyStatusDistribution.SOLD} sold`}
        />
      </div>

      {/* 1. Sales by Date (Volume Distribution Bar Chart) */}
      <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-display font-bold text-[#1E293B] dark:text-slate-100">
                Sales Valuation Volume by Period (2026)
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B] dark:text-slate-400 font-sans mt-0.5">
                Monthly property valuation conveyance trajectory.
              </CardDescription>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-3 py-1 rounded-full font-sans">
              6-Month Aggregate
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {salesByDate.map((item, idx) => {
            const percentage = Math.round((item.volume / maxVolume) * 100);
            return (
              <div key={idx} className="space-y-1.5 font-sans">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1E293B] dark:text-slate-100">{item.period}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#64748B] dark:text-slate-400">{item.count} Transactions</span>
                    <span className="font-bold text-[#0F766E] dark:text-teal-400">
                      ₱{(item.volume / 1000000).toFixed(1)} Million
                    </span>
                  </div>
                </div>
                <div className="w-full h-3.5 bg-[#F8FAFC] dark:bg-slate-800 rounded-full overflow-hidden border border-[#E2E8F0] dark:border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-[#0F766E] to-[#115E59] rounded-full transition-all duration-700"
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
      </Card>

      {/* 2. Sales by Consultant & Sales by Property Type Single-Column Responsive Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales by Agent Ranking Table */}
        <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs flex flex-col">
          <CardHeader className="pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
            <CardTitle className="text-lg font-display font-bold text-[#1E293B] dark:text-slate-100">
              Consultant Valuation Ranking
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left text-sm font-sans" aria-label="Consultant Valuation Ranking">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 border-b border-[#E2E8F0] dark:border-slate-800">
                  <th className="pb-2.5">Agent</th>
                  <th className="pb-2.5">Deals</th>
                  <th className="pb-2.5">Listings</th>
                  <th className="pb-2.5 text-right">Closed Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {salesByAgent.map((agent, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-semibold text-[#1E293B] dark:text-slate-100">{agent.agent_name}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{agent.deals}</td>
                    <td className="py-3 text-[#64748B] dark:text-slate-400">{agent.active_listings}</td>
                    <td className="py-3 text-right font-bold text-[#0F766E] dark:text-teal-400">
                      ₱{(agent.volume / 1000000).toFixed(0)}M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Sales by Property Type */}
        <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
              <CardTitle className="text-lg font-display font-bold text-[#1E293B] dark:text-slate-100">
                Valuation Distribution by Property Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 font-sans">
              {salesByPropertyType.map((prop, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[#1E293B] dark:text-slate-100">{prop.type}</span>
                    <span className="text-[#64748B] dark:text-slate-400">{prop.percentage}% • ₱{(prop.volume / 1000000).toFixed(0)}M</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F8FAFC] dark:bg-slate-800 rounded-full overflow-hidden border border-[#E2E8F0] dark:border-slate-700">
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
          </div>

          <div className="p-4 m-6 mt-0 bg-[#F8FAFC]/80 dark:bg-slate-800/60 rounded-xl text-xs font-sans text-slate-600 dark:text-slate-300 border border-[#E2E8F0] dark:border-slate-700">
            <strong>Key Insight:</strong> House &amp; Lot estates account for 42% of total transaction valuations, followed by prime high-rise penthouses in Makati and Taguig.
          </div>
        </Card>
      </div>
    </div>
  );
}
