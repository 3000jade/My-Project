import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchAndFilterBar from '../../components/dashboard/SearchAndFilterBar';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DataTable from '../../components/dashboard/DataTable';
import DashboardModal from '../../components/dashboard/DashboardModal';
import EmptyState from '../../components/dashboard/EmptyState';
import { appointmentService } from '../../services/appointmentService';

export default function AgentAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getAppointments({ agentId: 'agent-1' });
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load assigned appointments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Filtering
  const filtered = appointments.filter(a => {
    const client = a.client_name || '';
    const property = a.property_title || '';
    const notes = a.notes || '';
    const matchesSearch =
      client.toLowerCase().includes(search.toLowerCase()) ||
      property.toLowerCase().includes(search.toLowerCase()) ||
      notes.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (a.status || '').toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (id, newStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    try {
      await appointmentService.updateAppointment(id, { status: newStatus });
    } catch (err) {
      console.warn('Error updating status:', err.message);
    }
  };

  const handleOpenReschedule = (apt) => {
    setSelectedAppointment(apt);
    setNewDate(apt.appointment_date);
    setNewTime(apt.appointment_time);
    setRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async () => {
    if (!selectedAppointment) return;
    setSaving(true);
    try {
      const updated = await appointmentService.updateAppointment(selectedAppointment.id, {
        appointment_date: newDate,
        appointment_time: newTime,
        status: 'CONFIRMED',
      });
      setAppointments(prev => prev.map(a => a.id === selectedAppointment.id ? updated : a));
      setRescheduleModalOpen(false);
    } catch (err) {
      console.warn('Reschedule failed:', err.message);
      setAppointments(prev => prev.map(a =>
        a.id === selectedAppointment.id
          ? { ...a, appointment_date: newDate, appointment_time: newTime, status: 'CONFIRMED' }
          : a
      ));
      setRescheduleModalOpen(false);
    } finally {
      setSaving(false);
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
              className="px-2.5 py-1 bg-[#266F71] hover:bg-[#174849] text-white rounded-lg text-[11px] font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer"
            >
              Confirm
            </button>
          )}
          {row.status === 'CONFIRMED' && (
            <button
              onClick={(e) => { e.stopPropagation(); updateStatus(row.id, 'COMPLETED'); }}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer"
            >
              Mark Done
            </button>
          )}
          {row.status !== 'CANCELLED' && row.status !== 'COMPLETED' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleOpenReschedule(row); }}
                className="px-2.5 py-1 bg-[#F1F0EC] hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer"
              >
                Reschedule
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); updateStatus(row.id, 'CANCELLED'); }}
                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer"
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
        actions={
          <button
            onClick={loadAppointments}
            disabled={loading}
            className="h-[46px] px-4 bg-white hover:bg-gray-50 text-[#174849] border border-gray-200 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Refresh</span>
          </button>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 font-sans text-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>Failed to load appointments: {error}</span>
          </div>
          <button
            onClick={loadAppointments}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

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

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#266F71] border-t-transparent"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
            Loading viewing appointments...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="event"
          title="No appointments match your filters"
          description="Try broadening your status selection or search keywords."
          action={
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
              className="px-4 py-2 bg-[#266F71] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}

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
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 font-sans cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveReschedule}
              disabled={saving}
              className="px-5 py-2 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors"
            >
              {saving ? 'Updating...' : 'Update Appointment'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 font-sans">New Date</label>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-[#266F71]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 font-sans">New Time</label>
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
