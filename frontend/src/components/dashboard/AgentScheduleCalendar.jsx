import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  UserX,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  Building2,
  User,
  Download,
  Ban,
  ArrowRightLeft,
} from 'lucide-react';
import DashboardModal from './DashboardModal';
import {
  appointmentService,
  normalizeAppointment,
  generateAppointmentIcs,
} from '../../services/appointmentService';
import { agentService } from '../../services/agentService';
import { mockAgents } from '../../mockData/mockAgents';
import { cn } from '../../utils/cn';

/**
 * Mandatory Status Color Coding per docs/implementation/appointmentAndCalendarInterface.md:
 * - Pending (REQUESTED): Amber #B45309
 * - Confirmed: Blue #1D4ED8
 * - Completed: Green #15803D
 * - Cancelled: Gray #64748B (with strikethrough text)
 * - No-show: Red #B91C1C
 * - Blocked time: Slate #475569
 */
export const CALENDAR_STATUS_STYLES = {
  REQUESTED: {
    label: 'Pending',
    hex: '#B45309',
    bg: '#FEF3C7',
    border: '#F59E0B',
    strike: false,
  },
  PENDING: {
    label: 'Pending',
    hex: '#B45309',
    bg: '#FEF3C7',
    border: '#F59E0B',
    strike: false,
  },
  CONFIRMED: {
    label: 'Confirmed',
    hex: '#1D4ED8',
    bg: '#DBEAFE',
    border: '#3B82F6',
    strike: false,
  },
  COMPLETED: {
    label: 'Completed',
    hex: '#15803D',
    bg: '#DCFCE7',
    border: '#22C55E',
    strike: false,
  },
  CANCELLED: {
    label: 'Cancelled',
    hex: '#64748B',
    bg: '#F1F5F9',
    border: '#CBD5E1',
    strike: true,
  },
  NO_SHOW: {
    label: 'No-show',
    hex: '#B91C1C',
    bg: '#FEE2E2',
    border: '#EF4444',
    strike: false,
  },
  BLOCKED: {
    label: 'Blocked Time',
    hex: '#475569',
    bg: '#E2E8F0',
    border: '#64748B',
    strike: false,
  },
};

function addDays(dateStr, delta) {
  const dt = new Date(`${dateStr}T12:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

function getStartOfWeek(dateStr) {
  const dt = new Date(`${dateStr}T12:00:00Z`);
  const day = dt.getUTCDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

function getMonthGridDays(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  const firstDay = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0));
  const lastDay = new Date(Date.UTC(y, m, 0, 12, 0, 0));
  const startDow = firstDay.getUTCDay();
  const days = [];

  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(firstDay);
    d.setUTCDate(d.getUTCDate() - (i + 1));
    days.push({ date: d.toISOString().slice(0, 10), currentMonth: false });
  }
  for (let dNum = 1; dNum <= lastDay.getUTCDate(); dNum++) {
    const d = new Date(Date.UTC(y, m - 1, dNum, 12, 0, 0));
    days.push({ date: d.toISOString().slice(0, 10), currentMonth: true });
  }
  while (days.length % 7 !== 0) {
    const last = new Date(`${days[days.length - 1].date}T12:00:00Z`);
    last.setUTCDate(last.getUTCDate() + 1);
    days.push({ date: last.toISOString().slice(0, 10), currentMonth: false });
  }
  return days;
}

export default function AgentScheduleCalendar({
  role = 'broker', // 'broker' | 'agent' | 'client'
  fixedAgentId = null,
  fixedAgentName = null,
  initialView = 'agenda', // 'day' | 'week' | 'month' | 'agenda'
  initialDate = null,
  title = null,
  subtitle = null,
}) {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(initialDate || todayIso);
  const [viewMode, setViewMode] = useState(initialView);

  const [appointments, setAppointments] = useState([]);
  const [agents, setAgents] = useState(mockAgents);
  const [blackoutDates, setBlackoutDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState(
    fixedAgentId || (role === 'agent' ? 'agent-1' : 'ALL')
  );
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals & Drawers
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    property_id: '1',
    property_title: '',
    agent_id: fixedAgentId || 'agent-1',
    appointment_date: initialDate || todayIso,
    appointment_time: '10:00 AM',
    duration_minutes: 60,
    appointment_type: 'Site Visit',
    location: '',
    notes: '',
    internal_notes: '',
  });
  const [createError, setCreateError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [targetAgentId, setTargetAgentId] = useState('');
  const [reassignReason, setReassignReason] = useState('Schedule balance / coverage');

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [newBlock, setNewBlock] = useState({
    startDate: selectedDate,
    endDate: selectedDate,
    reason: 'Out of Office / Blocked Period',
  });

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = {};
      const effectiveAgent = fixedAgentId || (role === 'agent' ? 'agent-1' : undefined);
      if (effectiveAgent) {
        queryParams.agentId = effectiveAgent;
      }

      const [apptList, agentList, availData] = await Promise.all([
        appointmentService.getAppointments(queryParams),
        agentService?.getAgents ? agentService.getAgents().catch(() => mockAgents) : Promise.resolve(mockAgents),
        agentService?.getAvailability
          ? agentService.getAvailability(effectiveAgent || 'agent-1').catch(() => null)
          : Promise.resolve(null),
      ]);

      setAppointments(
        Array.isArray(apptList) ? apptList.map((a) => normalizeAppointment(a)) : []
      );
      if (Array.isArray(agentList) && agentList.length > 0) {
        setAgents(agentList);
      }
      if (availData && Array.isArray(availData.blackout_dates)) {
        setBlackoutDates(availData.blackout_dates);
      }
    } catch (err) {
      setError(
        role === 'broker'
          ? `Failed to load firm appointments: ${err.message || 'Network error'}`
          : `Failed to load appointments: ${err.message || 'Network error'}`
      );
    } finally {
      setLoading(false);
    }
  }, [fixedAgentId, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (a.client_name && a.client_name.toLowerCase().includes(q)) ||
        (a.property_title && a.property_title.toLowerCase().includes(q)) ||
        (a.agent_name && a.agent_name.toLowerCase().includes(q)) ||
        (a.notes && a.notes.toLowerCase().includes(q));

      const normalizedRowStatus =
        (a.status || 'REQUESTED').toUpperCase() === 'PENDING'
          ? 'REQUESTED'
          : (a.status || 'REQUESTED').toUpperCase();
      const normalizedFilter =
        statusFilter.toUpperCase() === 'PENDING' ? 'REQUESTED' : statusFilter.toUpperCase();

      const matchesStatus =
        statusFilter === 'ALL' || normalizedRowStatus === normalizedFilter;

      const matchesAgent =
        agentFilter === 'ALL' ||
        (agentFilter === 'UNASSIGNED' ? !a.agent_id : String(a.agent_id) === String(agentFilter));

      const matchesType =
        typeFilter === 'ALL' ||
        (a.appointment_type || '').toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesAgent && matchesType;
    });
  }, [appointments, search, statusFilter, agentFilter, typeFilter]);

  // KPI summary metrics
  const totalCount = appointments.length;
  const pendingCount = appointments.filter(
    (a) => (a.status || '').toUpperCase() === 'REQUESTED' || (a.status || '').toUpperCase() === 'PENDING'
  ).length;
  const confirmedCount = appointments.filter(
    (a) => (a.status || '').toUpperCase() === 'CONFIRMED'
  ).length;
  const completedCount = appointments.filter(
    (a) => (a.status || '').toUpperCase() === 'COMPLETED'
  ).length;
  const conflictCount = appointments.filter((a) => a.has_conflict).length;

  const handleNavigateDate = (direction) => {
    if (viewMode === 'day') {
      setSelectedDate((d) => addDays(d, direction));
    } else if (viewMode === 'week') {
      setSelectedDate((d) => addDays(d, direction * 7));
    } else {
      const [y, m] = selectedDate.split('-').map(Number);
      const next = new Date(Date.UTC(y, m - 1 + direction, 15, 12, 0, 0));
      setSelectedDate(next.toISOString().slice(0, 10));
    }
  };

  const handleStatusUpdate = async (aptId, newStatus, extra = {}) => {
    setSubmitting(true);
    try {
      const updated = await appointmentService.updateAppointment(aptId, {
        status: newStatus,
        ...extra,
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === aptId ? normalizeAppointment({ ...a, ...updated, status: newStatus, ...extra }) : a))
      );
      if (selectedAppointment && selectedAppointment.id === aptId) {
        setSelectedAppointment((prev) =>
          normalizeAppointment({ ...prev, ...updated, status: newStatus, ...extra })
        );
      }
      showToast(`Appointment status updated to ${newStatus}`);
    } catch (err) {
      showToast(err.message || 'Could not update appointment status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReschedule = (apt) => {
    setSelectedAppointment(apt);
    setRescheduleDate(apt.appointment_date);
    setRescheduleTime(apt.appointment_time);
    setRescheduleReason('');
    setRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async () => {
    if (!selectedAppointment) return;
    setSubmitting(true);
    try {
      const updated = await appointmentService.updateAppointment(selectedAppointment.id, {
        appointment_date: rescheduleDate,
        appointment_time: rescheduleTime,
        reschedule_reason: rescheduleReason || 'Rescheduled via calendar',
        status: 'CONFIRMED',
      });
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === selectedAppointment.id
            ? normalizeAppointment({
                ...a,
                ...updated,
                appointment_date: rescheduleDate,
                appointment_time: rescheduleTime,
                status: 'CONFIRMED',
              })
            : a
        )
      );
      setRescheduleModalOpen(false);
      showToast('Appointment rescheduled & reminder timers updated.');
    } catch (err) {
      showToast(err.message || 'Failed to reschedule appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCreateError('');
    if (!createForm.client_name.trim() || !createForm.client_phone.trim()) {
      setCreateError('Client name and phone number are required.');
      return;
    }

    setSubmitting(true);
    try {
      const assignedAgent = agents.find((ag) => String(ag.id) === String(createForm.agent_id));
      const payload = {
        ...createForm,
        property_title: createForm.property_title || 'Premier Estate Portfolio Asset',
        agent_name: assignedAgent?.name || fixedAgentName || 'Elena Rossi',
      };
      const created = await appointmentService.createAppointment(payload);
      setAppointments((prev) => [normalizeAppointment(created), ...prev]);
      setCreateModalOpen(false);
      setCreateForm({
        ...createForm,
        client_name: '',
        client_email: '',
        client_phone: '',
        property_title: '',
        notes: '',
        internal_notes: '',
      });
      showToast('New appointment scheduled on calendar.');
    } catch (err) {
      setCreateError(err?.response?.data?.error || err.message || 'Slot conflict detected.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReassign = async () => {
    if (!selectedAppointment) return;
    setSubmitting(true);
    try {
      const targetObj = agents.find((ag) => String(ag.id) === String(targetAgentId));
      const updated = await appointmentService.reassignAppointment(selectedAppointment.id, {
        target_agent_id: targetAgentId || null,
        target_agent_name: targetObj?.name || (targetAgentId ? 'Assigned Agent' : 'Unassigned Queue'),
        reason: reassignReason || 'Broker calendar reassignment',
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === selectedAppointment.id ? normalizeAppointment({ ...a, ...updated }) : a))
      );
      setSelectedAppointment((prev) => normalizeAppointment({ ...prev, ...updated }));
      setReassignModalOpen(false);
      showToast('Appointment reassigned successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to reassign appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBlockedTime = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newBlock.startDate || !newBlock.endDate) return;
    const nextBlocks = [
      ...blackoutDates,
      {
        id: `blk-${Date.now()}`,
        startDate: newBlock.startDate,
        endDate: newBlock.endDate,
        reason: newBlock.reason || 'Blocked Time',
      },
    ];
    setBlackoutDates(nextBlocks);
    setBlockModalOpen(false);
    if (agentService?.updateAvailability) {
      try {
        await agentService.updateAvailability(fixedAgentId || 'agent-1', {
          blackout_dates: nextBlocks,
        });
      } catch {
        // Ignore offline error
      }
    }
    showToast('Blocked period added to calendar.');
  };

  const handleDownloadIcs = (apt) => {
    const icsContent = generateAppointmentIcs(apt);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment-${apt.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded .ics calendar invite');
  };

  const renderStatusPill = (statusRaw, hasConflict = false) => {
    const key = String(statusRaw || 'REQUESTED').toUpperCase();
    const style = CALENDAR_STATUS_STYLES[key] || CALENDAR_STATUS_STYLES.REQUESTED;
    return (
      <span
        style={{
          color: style.hex,
          backgroundColor: style.bg,
          borderColor: style.border,
        }}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          hasConflict && 'ring-2 ring-amber-500'
        )}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: style.hex }}
        />
        <span>{style.label}</span>
        {hasConflict && <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />}
      </span>
    );
  };

  const weekDays = useMemo(() => {
    const start = getStartOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, idx) => addDays(start, idx));
  }, [selectedDate]);

  const monthGridDays = useMemo(() => getMonthGridDays(selectedDate), [selectedDate]);

  return (
    <div data-testid="agent-schedule-calendar" className="space-y-5">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1E293B] text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Optional Header Banner */}
      {title && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
              {title}
            </h1>
            {subtitle && <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="h-10 px-3.5 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCw className={cn('w-4 h-4 text-[#64748B]', loading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Summary Plinths */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Total Scheduled
          </p>
          <p className="text-2xl font-bold text-[#1E293B] mt-1">{totalCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs">
          <p
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: '#B45309' }}
          >
            Pending Requests
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#B45309' }}>
            {pendingCount}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs">
          <p
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: '#1D4ED8' }}
          >
            Confirmed Visits
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#1D4ED8' }}>
            {confirmedCount}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs">
          <p
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: '#15803D' }}
          >
            Completed
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#15803D' }}>
            {completedCount}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs col-span-2 md:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#B91C1C]">
            Schedule Conflicts
          </p>
          <p className="text-2xl font-bold text-[#B91C1C] mt-1">{conflictCount}</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-rose-700 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Calendar Controls Bar: View Switcher, Date Navigation, Timezone Badge & Actions */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          {/* Left: View Switcher (Day, Week, Month, Agenda) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1">
              {[
                { id: 'day', label: 'Day' },
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
                { id: 'agenda', label: 'Agenda' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setViewMode(v.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer',
                    viewMode === v.id
                      ? 'bg-[#0F766E] text-white shadow-2xs'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Today & Date Navigation */}
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={() => setSelectedDate(todayIso)}
                className="h-8 px-3 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleNavigateDate(-1)}
                aria-label="Previous date range"
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#64748B] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                aria-label="Selected calendar date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-mono font-semibold text-[#1E293B]"
              />
              <button
                type="button"
                onClick={() => handleNavigateDate(1)}
                aria-label="Next date range"
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#64748B] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0F766E] text-[11px] font-mono font-semibold">
              Asia/Manila (UTC+8) • 15m Buffer
            </span>
          </div>

          {/* Right: Create Appointment & Block Time CTAs */}
          {role !== 'client' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setBlockModalOpen(true)}
                className="h-9 px-3.5 bg-white hover:bg-slate-50 text-[#475569] border border-[#E2E8F0] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5 text-[#475569]" />
                <span>Block Time</span>
              </button>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="h-9 px-4 bg-[#FF6B6B] hover:bg-[#EE5A5A] text-[#1E293B] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Appointment</span>
              </button>
            </div>
          )}
        </div>

        {/* Search & Multi-Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client or property..."
              className="w-full h-9 pl-9 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] outline-none focus:bg-white focus:border-[#0F766E]"
            />
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="REQUESTED">Pending / Requested</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No-Show</option>
          </select>

          {!fixedAgentId && role === 'broker' && (
            <select
              aria-label="Filter by agent"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] cursor-pointer"
            >
              <option value="ALL">All Agents</option>
              <option value="UNASSIGNED">Unassigned Queue</option>
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>
          )}

          <select
            aria-label="Filter by appointment type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] cursor-pointer"
          >
            <option value="ALL">All Appointment Types</option>
            <option value="Site Visit">Site Visit</option>
            <option value="Property Inspection">Property Inspection</option>
            <option value="Online Consultation">Online Consultation</option>
            <option value="Document Signing">Document Signing</option>
            <option value="Closing Meeting">Closing Meeting</option>
          </select>
        </div>

        {/* Mandatory Visible Status Legend with exact spec Hex Colors */}
        <div
          data-testid="calendar-status-legend"
          className="pt-2 border-t border-[#E2E8F0] flex items-center flex-wrap gap-4 text-xs"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Status Legend:
          </span>
          <span
            data-testid="legend-pending"
            style={{ color: '#B45309' }}
            className="inline-flex items-center gap-1.5 font-semibold"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#B45309' }} />
            Pending (#B45309)
          </span>
          <span
            data-testid="legend-confirmed"
            style={{ color: '#1D4ED8' }}
            className="inline-flex items-center gap-1.5 font-semibold"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#1D4ED8' }} />
            Confirmed (#1D4ED8)
          </span>
          <span
            data-testid="legend-completed"
            style={{ color: '#15803D' }}
            className="inline-flex items-center gap-1.5 font-semibold"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#15803D' }} />
            Completed (#15803D)
          </span>
          <span
            data-testid="legend-cancelled"
            style={{ color: '#64748B' }}
            className="inline-flex items-center gap-1.5 font-semibold line-through"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#64748B' }} />
            Cancelled (#64748B)
          </span>
          <span
            data-testid="legend-no-show"
            style={{ color: '#B91C1C' }}
            className="inline-flex items-center gap-1.5 font-semibold"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#B91C1C' }} />
            No-show (#B91C1C)
          </span>
          <span
            data-testid="legend-blocked"
            style={{ color: '#475569' }}
            className="inline-flex items-center gap-1.5 font-semibold"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#475569' }} />
            Blocked time (#475569)
          </span>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0F766E] border-t-transparent" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Loading scheduled appointments...
          </p>
        </div>
      ) : (
        <>
          {/* ================================================================= */}
          {/* VIEW 1: DAY VIEW                                                  */}
          {/* ================================================================= */}
          {viewMode === 'day' && (
            <div
              data-testid="calendar-day-view"
              className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs overflow-hidden"
            >
              <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#0F766E]" />
                  <h3 className="text-sm font-bold text-[#1E293B]">
                    Day Schedule — {selectedDate}
                  </h3>
                  {selectedDate === todayIso && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F766E] text-white uppercase">
                      Today
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#64748B]">
                  {filteredAppointments.filter((a) => a.appointment_date === selectedDate).length}{' '}
                  appointment(s)
                </span>
              </div>

              {/* Blocked Period Banner if date falls in blackoutDates */}
              {blackoutDates
                .filter(
                  (b) =>
                    selectedDate >= (b.startDate || b.start || '') &&
                    selectedDate <= (b.endDate || b.end || '')
                )
                .map((b, idx) => (
                  <div
                    key={idx}
                    style={{
                      color: CALENDAR_STATUS_STYLES.BLOCKED.hex,
                      backgroundColor: CALENDAR_STATUS_STYLES.BLOCKED.bg,
                    }}
                    className="px-4 py-2.5 border-b border-slate-300 text-xs font-semibold flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4 shrink-0" />
                    <span>
                      Blocked Time / Unavailable: {b.reason || 'Out of Office'} (
                      {b.startDate || b.start} to {b.endDate || b.end})
                    </span>
                  </div>
                ))}

              <div className="divide-y divide-[#E2E8F0]">
                {filteredAppointments.filter((a) => a.appointment_date === selectedDate).length ===
                0 ? (
                  <div className="p-8 text-center text-xs text-[#64748B]">
                    No appointments scheduled for {selectedDate}.
                  </div>
                ) : (
                  filteredAppointments
                    .filter((a) => a.appointment_date === selectedDate)
                    .map((apt) => {
                      const style =
                        CALENDAR_STATUS_STYLES[String(apt.status).toUpperCase()] ||
                        CALENDAR_STATUS_STYLES.REQUESTED;
                      return (
                        <div
                          key={apt.id}
                          onClick={() => {
                            setSelectedAppointment(apt);
                            setDetailDrawerOpen(true);
                          }}
                          className={cn(
                            'p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors',
                            apt.has_conflict && 'bg-amber-50/40 border-l-4 border-l-amber-500'
                          )}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-mono text-xs font-bold text-[#0F766E]">
                                {apt.appointment_time} ({apt.duration_minutes || 60}m)
                              </span>
                              {renderStatusPill(apt.status, apt.has_conflict)}
                              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-[#1E293B] font-medium">
                                {apt.appointment_type}
                              </span>
                            </div>
                            <p
                              style={{ color: style.hex }}
                              className={cn(
                                'text-sm font-bold',
                                style.strike && 'line-through'
                              )}
                            >
                              {apt.client_name} — {apt.property_title}
                            </p>
                            <p className="text-xs text-[#64748B]">
                              Agent: {apt.agent_name} • Phone: {apt.client_phone}
                            </p>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 2: WEEK VIEW                                                 */}
          {/* ================================================================= */}
          {viewMode === 'week' && (
            <div
              data-testid="calendar-week-view"
              className="grid grid-cols-1 md:grid-cols-7 gap-2.5"
            >
              {weekDays.map((dayStr) => {
                const dayAppts = filteredAppointments.filter((a) => a.appointment_date === dayStr);
                const isToday = dayStr === todayIso;
                const isSelected = dayStr === selectedDate;
                const isBlocked = blackoutDates.some(
                  (b) =>
                    dayStr >= (b.startDate || b.start || '') &&
                    dayStr <= (b.endDate || b.end || '')
                );

                return (
                  <div
                    key={dayStr}
                    onClick={() => setSelectedDate(dayStr)}
                    className={cn(
                      'bg-white rounded-lg border p-3 min-h-[180px] flex flex-col gap-2 cursor-pointer transition-all',
                      isSelected
                        ? 'border-[#0F766E] ring-1 ring-[#0F766E]'
                        : 'border-[#E2E8F0] hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8F0]">
                      <span className="text-xs font-mono font-bold text-[#1E293B]">
                        {dayStr.slice(5)}
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#0F766E] text-white">
                          Today
                        </span>
                      )}
                    </div>

                    {isBlocked && (
                      <div
                        style={{
                          color: CALENDAR_STATUS_STYLES.BLOCKED.hex,
                          backgroundColor: CALENDAR_STATUS_STYLES.BLOCKED.bg,
                        }}
                        className="px-2 py-1 rounded text-[10px] font-semibold"
                      >
                        Blocked Period
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1">
                      {dayAppts.map((apt) => {
                        const style =
                          CALENDAR_STATUS_STYLES[String(apt.status).toUpperCase()] ||
                          CALENDAR_STATUS_STYLES.REQUESTED;
                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(apt);
                              setDetailDrawerOpen(true);
                            }}
                            style={{
                              backgroundColor: style.bg,
                              borderColor: style.border,
                              color: style.hex,
                            }}
                            className={cn(
                              'p-2 rounded border text-[11px] space-y-0.5',
                              apt.has_conflict && 'ring-2 ring-amber-500'
                            )}
                          >
                            <div className="font-mono font-bold flex items-center justify-between">
                              <span>{apt.appointment_time}</span>
                              {apt.has_conflict && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                            </div>
                            <p className={cn('font-semibold truncate', style.strike && 'line-through')}>
                              {apt.client_name}
                            </p>
                            <p className="text-[10px] opacity-85 truncate">{apt.property_title}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 3: MONTH VIEW                                                */}
          {/* ================================================================= */}
          {viewMode === 'month' && (
            <div
              data-testid="calendar-month-view"
              className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs overflow-hidden"
            >
              <div className="grid grid-cols-7 bg-[#F8FAFC] border-b border-[#E2E8F0] text-center py-2 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 divide-x divide-y divide-[#E2E8F0]">
                {monthGridDays.map((cell) => {
                  const dayAppts = filteredAppointments.filter(
                    (a) => a.appointment_date === cell.date
                  );
                  const isToday = cell.date === todayIso;
                  const isSelected = cell.date === selectedDate;
                  return (
                    <div
                      key={cell.date}
                      onClick={() => setSelectedDate(cell.date)}
                      className={cn(
                        'min-h-[100px] p-2 flex flex-col gap-1 cursor-pointer transition-colors',
                        !cell.currentMonth && 'bg-slate-50/60 text-slate-400',
                        isSelected && 'bg-teal-50/40 ring-1 ring-inset ring-[#0F766E]'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-xs font-mono font-semibold',
                            isToday &&
                              'bg-[#0F766E] text-white px-1.5 py-0.5 rounded-full text-[10px]'
                          )}
                        >
                          {cell.date.slice(8)}
                        </span>
                        {dayAppts.length > 0 && (
                          <span className="text-[10px] font-mono text-[#64748B]">
                            {dayAppts.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayAppts.slice(0, 3).map((apt) => {
                          const style =
                            CALENDAR_STATUS_STYLES[String(apt.status).toUpperCase()] ||
                            CALENDAR_STATUS_STYLES.REQUESTED;
                          return (
                            <div
                              key={apt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointment(apt);
                                setDetailDrawerOpen(true);
                              }}
                              style={{
                                backgroundColor: style.bg,
                                color: style.hex,
                                borderColor: style.border,
                              }}
                              className={cn(
                                'px-1.5 py-0.5 rounded border text-[10px] font-semibold truncate',
                                style.strike && 'line-through'
                              )}
                            >
                              {apt.appointment_time} {apt.client_name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 4: AGENDA / LIST VIEW                                        */}
          {/* ================================================================= */}
          {viewMode === 'agenda' && (
            <div
              data-testid="calendar-agenda-view"
              className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs overflow-hidden"
            >
              {filteredAppointments.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-[#1E293B]">
                    No appointments match your filters
                  </p>
                  <p className="text-xs text-[#64748B]">
                    Try clearing your search or status filter selection.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E2E8F0]">
                  {filteredAppointments.map((row) => {
                    const style =
                      CALENDAR_STATUS_STYLES[String(row.status).toUpperCase()] ||
                      CALENDAR_STATUS_STYLES.REQUESTED;
                    return (
                      <div
                        key={row.id}
                        onClick={() => {
                          setSelectedAppointment(row);
                          setDetailDrawerOpen(true);
                        }}
                        className={cn(
                          'p-4 sm:px-6 hover:bg-slate-50/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer transition-colors',
                          row.has_conflict && 'bg-amber-50/40 border-l-4 border-l-amber-500'
                        )}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-xs font-mono font-bold text-[#0F766E]">
                              {row.appointment_date} • {row.appointment_time}
                            </span>
                            {renderStatusPill(row.status, row.has_conflict)}
                            <span className="text-xs px-2.5 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] font-medium">
                              {row.appointment_type}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              data-testid={`appt-title-${row.id}`}
                              style={{ color: style.hex }}
                              className={cn(
                                'text-sm font-bold',
                                style.strike && 'line-through'
                              )}
                            >
                              {row.client_name}
                            </p>
                            <span className="text-xs text-[#64748B]">•</span>
                            <span className="text-xs font-semibold text-[#0F766E]">
                              {row.property_title}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-[#64748B] flex-wrap">
                            <span>Phone: {row.client_phone}</span>
                            <span>Agent: {row.agent_name}</span>
                            {row.has_conflict && row.conflict_reason && (
                              <span className="text-amber-700 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {row.conflict_reason}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Row Actions */}
                        <div
                          className="flex items-center gap-1.5 flex-wrap shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.status === 'REQUESTED' && role !== 'client' && (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(row.id, 'CONFIRMED')}
                              className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Confirm
                            </button>
                          )}
                          {row.status === 'CONFIRMED' && role !== 'client' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(row.id, 'COMPLETED')}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Mark Done
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(row.id, 'NO_SHOW')}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#B91C1C] border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                No-Show
                              </button>
                            </>
                          )}
                          {row.status !== 'CANCELLED' &&
                            row.status !== 'COMPLETED' &&
                            row.status !== 'NO_SHOW' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReschedule(row)}
                                  className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Reschedule
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(row.id, 'CANCELLED')}
                                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          {role === 'broker' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAppointment(row);
                                setTargetAgentId(row.agent_id || '');
                                setReassignModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#0F766E] border border-[#E2E8F0] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              title="Reassign Agent"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              <span>Reassign</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ===================================================================== */}
      {/* APPOINTMENT DETAIL DRAWER / MODAL                                     */}
      {/* ===================================================================== */}
      <DashboardModal
        isOpen={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        title="Appointment Dossier & Schedule Controls"
        subtitle={
          selectedAppointment
            ? `${selectedAppointment.appointment_type} • ${selectedAppointment.appointment_date} at ${selectedAppointment.appointment_time} (Asia/Manila)`
            : ''
        }
      >
        {selectedAppointment && (
          <div data-testid="appointment-detail-drawer" className="space-y-4 text-xs">
            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#1E293B]">
                  {selectedAppointment.client_name}
                </p>
                <p className="text-[#64748B] mt-0.5">
                  {selectedAppointment.client_phone} • {selectedAppointment.client_email}
                </p>
              </div>
              {renderStatusPill(selectedAppointment.status, selectedAppointment.has_conflict)}
            </div>

            {selectedAppointment.has_conflict && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Conflict Alert: {selectedAppointment.conflict_reason || 'Overlapping slot or blocked time'}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                  Property Listing
                </span>
                <p className="font-semibold text-[#1E293B] mt-0.5">
                  {selectedAppointment.property_title}
                </p>
                <p className="text-[11px] text-[#64748B]">
                  {selectedAppointment.location || 'Metro Manila'}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                  Assigned Agent
                </span>
                <p className="font-semibold text-[#1E293B] mt-0.5">
                  {selectedAppointment.agent_name}
                </p>
                <p className="text-[11px] text-[#64748B]">
                  Duration: {selectedAppointment.duration_minutes || 60} mins (+15m buffer)
                </p>
              </div>
            </div>

            {selectedAppointment.notes && (
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
                  Client / Appointment Notes
                </span>
                <p className="text-[#1E293B]">{selectedAppointment.notes}</p>
              </div>
            )}

            {/* Action Cluster inside Detail Drawer */}
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleDownloadIcs(selectedAppointment)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#0F766E] border border-[#E2E8F0] rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ICS Invite</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                {role !== 'client' && selectedAppointment.status === 'REQUESTED' && (
                  <button
                    type="button"
                    data-testid="drawer-confirm-btn"
                    onClick={() => handleStatusUpdate(selectedAppointment.id, 'CONFIRMED')}
                    className="px-3.5 py-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg font-semibold cursor-pointer"
                  >
                    Confirm Booking
                  </button>
                )}
                {role !== 'client' && selectedAppointment.status === 'CONFIRMED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedAppointment.id, 'COMPLETED')}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold cursor-pointer"
                    >
                      Mark Completed
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedAppointment.id, 'NO_SHOW')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#B91C1C] border border-rose-200 rounded-lg font-semibold cursor-pointer"
                    >
                      Mark No-Show
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDetailDrawerOpen(false);
                    handleOpenReschedule(selectedAppointment);
                  }}
                  className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-[#1E293B] border border-[#E2E8F0] rounded-lg font-semibold cursor-pointer"
                >
                  Reschedule
                </button>
                {role === 'broker' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailDrawerOpen(false);
                      setTargetAgentId(selectedAppointment.agent_id || '');
                      setReassignModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 rounded-lg font-semibold cursor-pointer"
                  >
                    Reassign Agent
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardModal>

      {/* ===================================================================== */}
      {/* CREATE NEW APPOINTMENT MODAL                                          */}
      {/* ===================================================================== */}
      <DashboardModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule New Appointment"
        subtitle="Book a property site visit, online consultation, or document signing with conflict & working-hours validation."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateAppointment}
              disabled={submitting}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              {submitting ? 'Scheduling...' : 'Create Appointment'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Client Name *</label>
              <input
                type="text"
                required
                placeholder="Full client name"
                value={createForm.client_name}
                onChange={(e) => setCreateForm({ ...createForm, client_name: e.target.value })}
                className="w-full h-9 px-3 border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Client Phone *</label>
              <input
                type="text"
                required
                placeholder="+63 917 000 0000"
                value={createForm.client_phone}
                onChange={(e) => setCreateForm({ ...createForm, client_phone: e.target.value })}
                className="w-full h-9 px-3 border border-[#E2E8F0] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Property / Listing *</label>
              <input
                type="text"
                required
                placeholder="Property title or address"
                value={createForm.property_title}
                onChange={(e) => setCreateForm({ ...createForm, property_title: e.target.value })}
                className="w-full h-9 px-3 border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Assigned Agent</label>
              <select
                value={createForm.agent_id}
                onChange={(e) => setCreateForm({ ...createForm, agent_id: e.target.value })}
                disabled={Boolean(fixedAgentId)}
                className="w-full h-9 px-3 border border-[#E2E8F0] rounded-lg bg-white"
              >
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Date *</label>
              <input
                type="date"
                value={createForm.appointment_date}
                onChange={(e) => setCreateForm({ ...createForm, appointment_date: e.target.value })}
                className="w-full h-9 px-3 border border-[#E2E8F0] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Time *</label>
              <input
                type="text"
                value={createForm.appointment_time}
                onChange={(e) => setCreateForm({ ...createForm, appointment_time: e.target.value })}
                placeholder="10:00 AM"
                className="w-full h-9 px-3 border border-[#E2E8F0] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Type</label>
              <select
                value={createForm.appointment_type}
                onChange={(e) => setCreateForm({ ...createForm, appointment_type: e.target.value })}
                className="w-full h-9 px-3 border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="Site Visit">Site Visit</option>
                <option value="Property Inspection">Property Inspection</option>
                <option value="Online Consultation">Online Consultation</option>
                <option value="Document Signing">Document Signing</option>
                <option value="Closing Meeting">Closing Meeting</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#1E293B] mb-1">Notes</label>
            <textarea
              rows={2}
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder="Client instructions, gate pass details, or meeting link..."
              className="w-full p-2.5 border border-[#E2E8F0] rounded-lg"
            />
          </div>
        </form>
      </DashboardModal>

      {/* ===================================================================== */}
      {/* RESCHEDULE APPOINTMENT MODAL                                          */}
      {/* ===================================================================== */}
      <DashboardModal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title="Reschedule Appointment"
        subtitle={`Select a new date and time for ${selectedAppointment?.client_name}`}
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRescheduleModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#64748B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveReschedule}
              disabled={submitting}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {submitting ? 'Updating...' : 'Update Appointment'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#64748B] mb-1">
              New Date
            </label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#64748B] mb-1">
              New Time
            </label>
            <input
              type="text"
              placeholder="e.g. 02:00 PM"
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#64748B] mb-1">
              Reason for Rescheduling
            </label>
            <input
              type="text"
              placeholder="e.g. Client requested afternoon viewing"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg"
            />
          </div>
        </div>
      </DashboardModal>

      {/* ===================================================================== */}
      {/* REASSIGN AGENT MODAL (BROKER)                                         */}
      {/* ===================================================================== */}
      <DashboardModal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title="Reassign Appointment Agent"
        subtitle={`Transfer viewing for ${selectedAppointment?.client_name} while validating schedule conflicts.`}
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setReassignModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReassign}
              disabled={submitting}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              {submitting ? 'Reassigning...' : 'Confirm Reassignment'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#1E293B] mb-1">
              Target Agent or Unassigned Queue
            </label>
            <select
              value={targetAgentId}
              onChange={(e) => setTargetAgentId(e.target.value)}
              className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg bg-white"
            >
              <option value="">Brokerage Unassigned Queue</option>
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#1E293B] mb-1">
              Reason for Reassignment *
            </label>
            <input
              type="text"
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg"
            />
          </div>
        </div>
      </DashboardModal>

      {/* ===================================================================== */}
      {/* ADD BLOCKED TIME / BLACKOUT MODAL                                     */}
      {/* ===================================================================== */}
      <DashboardModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        title="Add Blocked Time / Blackout Period"
        subtitle="Prevent new appointments during unavailable dates and flag any overlapping bookings."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBlockModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddBlockedTime}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Save Blocked Period
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Start Date</label>
              <input
                type="date"
                value={newBlock.startDate}
                onChange={(e) => setNewBlock({ ...newBlock, startDate: e.target.value })}
                className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">End Date</label>
              <input
                type="date"
                value={newBlock.endDate}
                onChange={(e) => setNewBlock({ ...newBlock, endDate: e.target.value })}
                className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-[#1E293B] mb-1">Reason</label>
            <input
              type="text"
              value={newBlock.reason}
              onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
              className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg"
            />
          </div>
        </div>
      </DashboardModal>
    </div>
  );
}
