import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MetricCard from '../../components/dashboard/MetricCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import PageHeader from '../../components/dashboard/PageHeader';
import { mockProperties } from '../../mockData/mockProperties';
import { mockInquiries } from '../../mockData/mockInquiries';
import { mockAppointments } from '../../mockData/mockAppointments';
import { mockSales } from '../../mockData/mockSales';
import { mockActivity } from '../../mockData/mockActivity';

export default function AgentDashboard() {
  // Current agent properties and records
  const agentProperties = mockProperties.filter(p => p.agent_id === 'agent-1');
  const agentInquiries = mockInquiries.filter(i => i.agent_id === 'agent-1');
  const agentAppointments = mockAppointments.filter(a => a.agent_id === 'agent-1');
  const agentSales = mockSales.filter(s => s.agent_id === 'agent-1');

  // Metrics computation
  const totalProperties = agentProperties.length;
  const availableProperties = agentProperties.filter(p => p.status === 'AVAILABLE').length;
  const reservedProperties = agentProperties.filter(p => p.status === 'RESERVED').length;
  const soldProperties = agentProperties.filter(p => p.status === 'SOLD').length;
  const newInquiries = agentInquiries.filter(i => i.status === 'NEW').length;
  const unresolvedInquiries = agentInquiries.filter(i => i.status === 'NEW' || i.status === 'ASSIGNED' || i.status === 'REOPENED').length;
  const upcomingAppointments = agentAppointments.filter(a => a.status === 'REQUESTED' || a.status === 'CONFIRMED').length;

  const totalRecordedSalesValue = agentSales
    .filter(s => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + s.property_value, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agent Overview"
        subtitle="Track assigned property listings, client inquiries, viewing appointments, and sales milestones."
        actions={
          <Link
            to="/agent/properties/create"
            className="h-[46px] px-5 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Property
          </Link>
        }
      />

      {/* 1. Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <MetricCard
          title="Total Properties"
          value={totalProperties}
          icon="apartment"
          subtitle="Assigned to you"
        />
        <MetricCard
          title="Available"
          value={availableProperties}
          icon="check_circle"
          subtitle="Ready for viewing"
        />
        <MetricCard
          title="Reserved"
          value={reservedProperties}
          icon="bookmark"
          subtitle="Deposit initiated"
        />
        <MetricCard
          title="Sold"
          value={soldProperties}
          icon="verified"
          subtitle="Closed transactions"
        />
        <MetricCard
          title="New Inquiries"
          value={newInquiries}
          icon="mark_email_unread"
          accent={newInquiries > 0}
          subtitle="Requires response"
        />
        <MetricCard
          title="Unresolved"
          value={unresolvedInquiries}
          icon="pending_actions"
          subtitle="Active discussions"
        />
        <MetricCard
          title="Appointments"
          value={upcomingAppointments}
          icon="event"
          subtitle="Upcoming viewings"
        />
      </div>

      {/* 2. Sales Summary Section */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FB8E5D] font-sans">
              Sales Monitoring
            </span>
            <h3 className="text-xl font-display font-bold text-[#174849] mt-0.5">
              Recorded Sales Performance
            </h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              Summary of completed and pending transaction values.
            </p>
          </div>
          <div className="flex items-center gap-6 bg-[#F1F0EC]/60 px-5 py-3 rounded-xl">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-sans">
                Total Closed Value
              </p>
              <p className="text-xl font-display font-bold text-[#174849]">
                ₱{(totalRecordedSalesValue / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="w-[1px] h-8 bg-gray-300" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-sans">
                Recorded Sales Count
              </p>
              <p className="text-xl font-display font-bold text-[#266F71]">
                {agentSales.length} Deals
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
                <th className="pb-3">Sale Date</th>
                <th className="pb-3">Property Value</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agentSales.slice(0, 3).map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 font-semibold text-[#174849]">{sale.property_title}</td>
                  <td className="py-3 text-gray-600">{sale.client_name}</td>
                  <td className="py-3 text-gray-500">{sale.sale_date}</td>
                  <td className="py-3 font-bold text-[#266F71]">
                    ₱{sale.property_value.toLocaleString()}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={sale.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <Link
            to="/agent/sales"
            className="text-xs font-bold font-sans uppercase tracking-wider text-[#266F71] hover:text-[#174849] transition-colors"
          >
            View Full Sales Monitoring →
          </Link>
        </div>
      </div>

      {/* 3 & 4. Appointments & Inquiries Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-display font-bold text-[#174849]">
                Upcoming Appointments
              </h3>
              <p className="text-xs text-gray-500 font-sans">
                Scheduled client site tours & consultations
              </p>
            </div>
            <Link
              to="/agent/appointments"
              className="text-xs font-bold text-[#266F71] uppercase tracking-wider font-sans hover:underline"
            >
              All Appointments
            </Link>
          </div>

          <div className="divide-y divide-gray-100 flex-1 mt-2">
            {agentAppointments.slice(0, 4).map((apt) => (
              <div key={apt.id} className="py-4 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#174849] font-sans">
                      {apt.client_name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                      {apt.appointment_type}
                    </span>
                  </div>
                  <p className="text-xs text-[#266F71] font-medium font-sans">
                    {apt.property_title}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 font-sans">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {apt.appointment_date} at {apt.appointment_time}
                  </p>
                </div>
                <div>
                  <StatusBadge status={apt.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-display font-bold text-[#174849]">
                Recent Inquiries
              </h3>
              <p className="text-xs text-gray-500 font-sans">
                Incoming messages & property interest
              </p>
            </div>
            <Link
              to="/agent/inquiries"
              className="text-xs font-bold text-[#266F71] uppercase tracking-wider font-sans hover:underline"
            >
              All Inquiries
            </Link>
          </div>

          <div className="divide-y divide-gray-100 flex-1 mt-2">
            {agentInquiries.slice(0, 4).map((inq) => (
              <Link
                key={inq.id}
                to={`/agent/inquiries/${inq.id}`}
                className="py-4 block hover:bg-gray-50/70 rounded-xl px-2 -mx-2 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-[#174849] font-sans">
                      {inq.client_name}
                    </span>
                    <p className="text-xs text-[#266F71] font-medium font-sans">
                      {inq.property_title}
                    </p>
                  </div>
                  <StatusBadge status={inq.status} />
                </div>
                <p className="text-xs text-gray-500 font-sans line-clamp-1 mt-1.5">
                  "{inq.last_message}"
                </p>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {inq.created_at}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Recent Activity Feed */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
        <h3 className="text-lg font-display font-bold text-[#174849] mb-4">
          Recent Activity Timeline
        </h3>
        <div className="space-y-4">
          {mockActivity.slice(0, 5).map((act) => (
            <div key={act.id} className="flex items-start gap-3.5 text-sm font-sans">
              <div className="w-8 h-8 rounded-full bg-[#266F71]/10 text-[#266F71] flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[18px]">{act.icon}</span>
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <span className="font-bold text-[#174849]">{act.action}</span>
                  <span className="text-gray-500"> — {act.user_name} on </span>
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
