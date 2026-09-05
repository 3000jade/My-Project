import React from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import MetricCard from '../../components/dashboard/MetricCard';
import { mockReportsData } from '../../mockData/mockReports';

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
    <div className="space-y-8">
      <PageHeader
        title="Broker Operations & Sales Reports"
        subtitle="Executive analytical summaries across historical closed sales, consultant rankings, and client engagement."
        breadcrumbs={[
          { label: "Dashboard", to: "/broker/dashboard" },
          { label: "Reports & Analytics" }
        ]}
      />

      {/* High-level Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-display font-bold text-[#174849]">
              Sales Valuation Volume by Period (2026)
            </h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              Monthly property valuation conveyance trajectory.
            </p>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#266F71] bg-[#266F71]/10 px-3 py-1 rounded-full font-sans">
            6-Month Aggregate
          </span>
        </div>

        <div className="space-y-4 pt-2">
          {salesByDate.map((item, idx) => {
            const percentage = Math.round((item.volume / maxVolume) * 100);
            return (
              <div key={idx} className="space-y-1.5 font-sans">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#174849]">{item.period}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">{item.count} Transactions</span>
                    <span className="font-bold text-[#266F71]">
                      ₱{(item.volume / 1000000).toFixed(1)} Million
                    </span>
                  </div>
                </div>
                <div className="w-full h-3.5 bg-[#F1F0EC] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#266F71] to-[#174849] rounded-full transition-all duration-700"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Sales by Consultant & Sales by Property Type Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales by Agent Ranking Table */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4 flex flex-col">
          <h3 className="text-lg font-display font-bold text-[#174849] pb-3 border-b border-gray-100">
            Consultant Valuation Ranking
          </h3>
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left text-sm font-sans">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-2.5">Agent</th>
                  <th className="pb-2.5">Deals</th>
                  <th className="pb-2.5">Listings</th>
                  <th className="pb-2.5 text-right">Closed Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {salesByAgent.map((agent, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3 font-semibold text-[#174849]">{agent.agent_name}</td>
                    <td className="py-3 text-gray-600">{agent.deals}</td>
                    <td className="py-3 text-gray-500">{agent.active_listings}</td>
                    <td className="py-3 text-right font-bold text-[#266F71]">
                      ₱{(agent.volume / 1000000).toFixed(0)}M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by Property Type */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-display font-bold text-[#174849] pb-3 border-b border-gray-100">
              Valuation Distribution by Property Type
            </h3>
            <div className="space-y-4 mt-4 font-sans">
              {salesByPropertyType.map((prop, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[#174849]">{prop.type}</span>
                    <span className="text-gray-500">{prop.percentage}% • ₱{(prop.volume / 1000000).toFixed(0)}M</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F1F0EC] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FB8E5D] rounded-full"
                      style={{ width: `${prop.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-[#F1F0EC]/60 rounded-xl text-xs font-sans text-gray-600">
            <strong>Key Insight:</strong> House & Lot estates account for 42% of total transaction valuations, followed by prime high-rise penthouses in Makati and Taguig.
          </div>
        </div>
      </div>
    </div>
  );
}
