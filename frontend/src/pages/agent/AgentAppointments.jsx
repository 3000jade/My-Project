import React, { useState } from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import DashboardModal from '../../components/dashboard/DashboardModal';
import { mockAppointments } from '../../mockData/mockAppointments';

export default function AgentAppointments() {
  const [appointments, setAppointments] = useState(mockAppointments.filter(a => a.agent_id === 'agent-1'));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // Filtering
  const filtered = appointments.filter(a => {
    const matchesSearch = a.client_name.toLowerCase().includes(search.toLowerCase()) ||
                          a.property_title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = (id, newStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const handleOpenReschedule = (apt) => {
    setSelectedAppointment(apt);
    setNewDate(apt.appointment_date);
    setNewTime(apt.appointment_time);
    setRescheduleModalOpen(true);
  };

  const handleSaveReschedule = () => {
    if (selectedAppointment) {
      setAppointments(prev => prev.map(a =>
        a.id === selectedAppointment.id
          ? { ...a, appointment_date: newDate, appointment_time: newTime, status: 'CONFIRMED' }
          : a
      ));
      setRescheduleModalOpen(false);
    }
  };

  const columns = [
    {
      header: "Client & Contact",
      render: (row) => (
        <div>
          <p className="font-bold text-[#174849] font-sans">{row.client_name}</p>
          <p className="text-xs text-gray-400 font-sans">{row.client_phone}</p>
        </div>
      )
    },
    {
      header: "Property",
      render: (row) => (
        <span className="font-semibold text-[#266F71] font-sans">{row.property_title}</span>
      )
    },
    {
      header: "Schedule",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-800 font-sans">{row.appointment_date}</p>
          <p className="text-xs text-gray-400 font-sans">{row.appointment_time}</p>
        </div>
      )
    },
    {
      header: "Type",
      render: (row) => (
        <span className="text-xs px-2.5 py-1 rounded-md bg-[#F1F0EC] text-[#174849] font-medium font-sans">
          {row.appointment_type}
        </span>
      )
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {row.status === 'REQUESTED' && (
            <button
              onClick={(e) => { e.stopPropagation(); updateStatus(row.id, 'CONFIRMED'); }}
              className="px-2.5 py-1 bg-[#266F71] hover:bg-[#174849] text-white rounded-lg text-[11px] font-bold font-sans uppercase tracking-wider transition-colors"
            >
              Confirm
            </button>
          )}
          {row.status === 'CONFIRMED' && (
            <button
              onClick={(e) => { e.stopPropagation(); updateStatus(row.id, 'COMPLETED'); }}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold font-sans uppercase tracking-wider transition-colors"
            >
              Mark Done
            </button>
          )}
          {row.status !== 'CANCELLED' && row.status !== 'COMPLETED' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleOpenReschedule(row); }}
                className="px-2.5 py-1 bg-[#F1F0EC] hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold font-sans uppercase tracking-wider transition-colors"
              >
                Reschedule
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); updateStatus(row.id, 'CANCELLED'); }}
                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-bold font-sans uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Viewing Appointments"
        subtitle="Manage client property tours, virtual walk-throughs, and transaction signing dates."
        breadcrumbs={[
          { label: "Dashboard", to: "/agent/dashboard" },
          { label: "Appointments" }
        ]}
      />

      <SearchAndFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by client or property title..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "ALL" },
              { label: "Requested", value: "REQUESTED" },
              { label: "Confirmed", value: "CONFIRMED" },
              { label: "Completed", value: "COMPLETED" },
              { label: "Cancelled", value: "CANCELLED" },
            ]
          }
        ]}
      />

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No appointments match your filters."
      />

      {/* Reschedule Modal */}
      <DashboardModal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title="Reschedule Appointment"
        subtitle={`Select a new date and time for ${selectedAppointment?.client_name}`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setRescheduleModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 font-sans"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveReschedule}
              className="px-5 py-2 bg-[#266F71] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans"
            >
              Update Appointment
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">New Date</label>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-[#266F71]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">New Time</label>
            <input
              type="text"
              placeholder="e.g. 02:00 PM"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-[#266F71]"
            />
          </div>
        </div>
      </DashboardModal>
    </div>
  );
}
