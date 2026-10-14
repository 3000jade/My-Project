import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MetricCard from '../../../components/dashboard/MetricCard';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import PageHeader from '../../../components/dashboard/PageHeader';
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
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Consolidated real estate firm monitoring, agent performance metrics, and sales audit trail."
        actions={
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="h-[40px] px-3.5 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
            <Link
              to="/broker/reports"
              className="h-[40px] px-3.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#1E293B] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[18px]">analytics</span>
              Reports & Audit
            </Link>
            <Link
              to="/broker/agents"
              className="h-[40px] px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">group</span>
              Manage Agents
            </Link>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600">warning</span>
            <span>{error}</span>
          </div>
          <button
            onClick={loadDashboard}
            className="px-3 py-1 bg-amber-600 text-white text-xs font-semibold uppercase rounded-md tracking-wider hover:bg-amber-700 cursor-pointer shadow-2xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. Ten Summary Metric Cards */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#64748B] mb-4">
          Firm-Wide Key Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
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

      {/* 2. Sales Summary Section */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E2E8F0]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              Firm-Wide Sales Audit
            </span>
            <h3 className="text-xl font-bold text-[#1E293B] mt-1">
              Sales Monitoring & Recorded Valuations
            </h3>
            <p className="text-sm text-[#64748B] mt-1">
              Real estate transaction registry across all licensed consultants.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 bg-[#F8FAFC] border border-[#E2E8F0] px-6 py-4 rounded-lg">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Total Closed Valuation
              </p>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[#1E293B]">
                {`₱${(totalSalesValue / 1000000).toFixed(1)}M`}
              </p>
            </div>
            <div className="w-[1px] h-10 bg-[#E2E8F0] hidden sm:block" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Number of Closed Sales
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-[#0F766E]">
                {`${closedCount} Deals`}
              </p>
            </div>
          </div>
        </div>

        {/* Recent sales preview */}
        <div className="mt-6 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                <th className="pb-3.5 px-3">Property</th>
                <th className="pb-3.5 px-3">Client</th>
                <th className="pb-3.5 px-3">Handling Agent</th>
                <th className="pb-3.5 px-3">Sale Date</th>
                <th className="pb-3.5 px-3">Property Value</th>
                <th className="pb-3.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {recentSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-4 px-3 font-semibold text-[#1E293B]">{sale.property_title}</td>
                  <td className="py-4 px-3 text-[#64748B]">{sale.client_name}</td>
                  <td className="py-4 px-3 text-[#1E293B] font-medium">{sale.agent_name}</td>
                  <td className="py-4 px-3 text-[#64748B]">{sale.sale_date}</td>
                  <td className="py-4 px-3 font-bold text-[#0F766E] font-mono">
                    {`₱${(sale.property_value || 0).toLocaleString()}`}
                  </td>
                  <td className="py-4 px-3">
                    <StatusBadge status={sale.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Agent Performance Overview */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#1E293B]">
              Agent Performance & Caseload Overview
            </h3>
            <p className="text-sm text-[#64748B]">
              Monitoring active listings, inquiries, appointments, and sales milestones.
            </p>
          </div>
          <Link
            to="/broker/agents"
            className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider hover:underline shrink-0"
          >
            All Agents Directory →
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                <th className="pb-3.5 px-3">Consultant</th>
                <th className="pb-3.5 px-3">Verification</th>
                <th className="pb-3.5 px-3">Assigned Properties</th>
                <th className="pb-3.5 px-3">Active Inquiries</th>
                <th className="pb-3.5 px-3">Upcoming Tours</th>
                <th className="pb-3.5 px-3">Recorded Sales</th>
                <th className="pb-3.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {agentOverview.map((ag) => (
                <tr key={ag.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={ag.avatar}
                        alt={ag.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0]"
                      />
                      <div>
                        <p className="font-semibold text-[#1E293B]">{ag.name}</p>
                        <p className="text-xs text-[#64748B]">{ag.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <StatusBadge status={ag.verification_status} />
                  </td>
                  <td className="py-4 px-3 font-medium text-[#1E293B]">
                    {ag.assigned_properties_count} Properties
                  </td>
                  <td className="py-4 px-3 font-medium text-[#1E293B]">
                    {ag.active_inquiries_count} Inquiries
                  </td>
                  <td className="py-4 px-3 font-medium text-[#1E293B]">
                    {ag.upcoming_appointments_count} Tours
                  </td>
                  <td className="py-4 px-3 font-bold text-[#0F766E] font-mono">
                    {`${ag.recorded_sales_count} Deals (₱${((ag.total_sales_value || 0) / 1000000).toFixed(0)}M)`}
                  </td>
                  <td className="py-4 px-3 text-right">
                    <Link
                      to={`/broker/agents/${ag.id}`}
                      className="px-3.5 py-1.5 rounded-md bg-teal-50 text-[#0F766E] hover:bg-[#0F766E] hover:text-white border border-teal-200 text-xs font-semibold uppercase tracking-wider transition-colors inline-block"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Recent Firm Activity Feed */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <h3 className="text-lg font-bold text-[#1E293B] mb-4">
          Firm-Wide Operations Activity Log
        </h3>
        <div className="space-y-3">
          {recentActivity.map((act) => (
            <div key={act.id} className="flex items-start gap-3.5 text-sm py-1">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0F766E] border border-teal-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[19px]">{act.icon}</span>
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="font-semibold text-[#1E293B]">{act.action}</span>
                  <span className="text-[#64748B]"> — {act.user_name} regarding </span>
                  <span className="font-medium text-[#1E293B]">{act.target}</span>
                </div>
                <span className="text-xs text-[#64748B] shrink-0 mt-0.5 sm:mt-0 font-mono">
                  {act.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
