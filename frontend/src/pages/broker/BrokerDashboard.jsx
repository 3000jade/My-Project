import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MetricCard from '../../components/dashboard/MetricCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import PageHeader from '../../components/dashboard/PageHeader';
import { dashboardService, computeBrokerFallback } from '../../services/dashboardService';

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
    <div className="space-y-8">
      <PageHeader
        title="Executive Broker Operations"
        subtitle="Consolidated real estate firm monitoring, agent performance metrics, and sales audit trail."
        actions={
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="h-[46px] px-4 bg-white hover:bg-gray-50 text-[#174849] border border-gray-200 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
            <Link
              to="/broker/reports"
              className="h-[46px] px-4 rounded-xl border border-gray-300 hover:bg-white text-gray-700 text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">analytics</span>
              Reports & Audit
            </Link>
            <Link
              to="/broker/agents"
              className="h-[46px] px-5 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">group</span>
              Manage Agents
            </Link>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-800 font-sans text-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600">warning</span>
            <span>{error}</span>
          </div>
          <button
            onClick={loadDashboard}
            className="px-3 py-1 bg-amber-600 text-white text-xs font-bold uppercase rounded-lg tracking-wider hover:bg-amber-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. Ten Summary Metric Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans mb-3">
          Firm-Wide Key Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FB8E5D] font-sans">
              Firm-Wide Sales Audit
            </span>
            <h3 className="text-xl font-display font-bold text-[#174849] mt-0.5">
              Sales Monitoring & Recorded Valuations
            </h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              Real estate transaction registry across all licensed consultants.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 bg-[#F1F0EC]/60 px-6 py-3.5 rounded-2xl">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-sans">
                Total Closed Valuation
              </p>
              <p className="text-2xl font-display font-bold text-[#174849]">
                {`₱${(totalSalesValue / 1000000).toFixed(1)}M`}
              </p>
            </div>
            <div className="w-[1px] h-9 bg-gray-300 hidden sm:block" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-sans">
                Number of Closed Sales
              </p>
              <p className="text-2xl font-display font-bold text-[#266F71]">
                {`${closedCount} Deals`}
              </p>
            </div>
          </div>
        </div>

        {/* Recent sales preview */}
        <div className="mt-5 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm font-sans">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="pb-3">Property</th>
                <th className="pb-3">Client</th>
                <th className="pb-3">Handling Agent</th>
                <th className="pb-3">Sale Date</th>
                <th className="pb-3">Property Value</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 font-semibold text-[#174849]">{sale.property_title}</td>
                  <td className="py-3 text-gray-600">{sale.client_name}</td>
                  <td className="py-3 text-gray-600 font-medium">{sale.agent_name}</td>
                  <td className="py-3 text-gray-500">{sale.sale_date}</td>
                  <td className="py-3 font-bold text-[#266F71]">
                    {`₱${(sale.property_value || 0).toLocaleString()}`}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={sale.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Agent Performance Overview */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-display font-bold text-[#174849]">
              Agent Performance & Caseload Overview
            </h3>
            <p className="text-xs text-gray-500 font-sans">
              Monitoring active listings, inquiries, appointments, and sales milestones.
            </p>
          </div>
          <Link
            to="/broker/agents"
            className="text-xs font-bold text-[#266F71] uppercase tracking-wider font-sans hover:underline"
          >
            All Agents Directory →
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm font-sans">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="pb-3">Consultant</th>
                <th className="pb-3">Verification</th>
                <th className="pb-3">Assigned Properties</th>
                <th className="pb-3">Active Inquiries</th>
                <th className="pb-3">Upcoming Tours</th>
                <th className="pb-3">Recorded Sales</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agentOverview.map((ag) => (
                <tr key={ag.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={ag.avatar}
                        alt={ag.name}
                        className="w-9 h-9 rounded-full object-cover border border-gray-200"
                      />
                      <div>
                        <p className="font-bold text-[#174849]">{ag.name}</p>
                        <p className="text-xs text-gray-400">{ag.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <StatusBadge status={ag.verification_status} />
                  </td>
                  <td className="py-3.5 font-semibold text-gray-700">
                    {ag.assigned_properties_count} Properties
                  </td>
                  <td className="py-3.5 font-semibold text-gray-700">
                    {ag.active_inquiries_count} Inquiries
                  </td>
                  <td className="py-3.5 font-semibold text-gray-700">
                    {ag.upcoming_appointments_count} Tours
                  </td>
                  <td className="py-3.5 font-bold text-[#266F71]">
                    {`${ag.recorded_sales_count} Deals (₱${((ag.total_sales_value || 0) / 1000000).toFixed(0)}M)`}
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      to={`/broker/agents/${ag.id}`}
                      className="px-3 py-1.5 rounded-lg bg-[#F1F0EC] hover:bg-[#266F71] hover:text-white text-xs font-bold font-sans uppercase tracking-wider transition-colors inline-block"
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
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
        <h3 className="text-lg font-display font-bold text-[#174849] mb-4">
          Firm-Wide Operations Activity Log
        </h3>
        <div className="space-y-4">
          {recentActivity.map((act) => (
            <div key={act.id} className="flex items-start gap-3.5 text-sm font-sans">
              <div className="w-8 h-8 rounded-full bg-[#266F71]/10 text-[#266F71] flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[18px]">{act.icon}</span>
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <span className="font-bold text-[#174849]">{act.action}</span>
                  <span className="text-gray-500"> — {act.user_name} regarding </span>
                  <span className="font-semibold text-gray-700">{act.target}</span>
                </div>
                <span className="text-xs text-gray-400 shrink-0 mt-1 sm:mt-0">
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
