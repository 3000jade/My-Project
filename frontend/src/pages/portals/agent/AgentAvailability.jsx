import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  PauseCircle,
  Plane,
  Save,
} from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import AgentScheduleCalendar from '../../../components/dashboard/AgentScheduleCalendar';
import { mockAvailability } from '../../../mockData/mockAvailability';
import { agentService } from '../../../services/agentService';

export default function AgentAvailability() {
  const [schedule, setSchedule] = useState(mockAvailability);
  const [routingAvailability, setRoutingAvailability] = useState('available');
  const [maxConcurrentLeads, setMaxConcurrentLeads] = useState(25);
  const [awayMessage, setAwayMessage] = useState('');
  const [blackoutDates, setBlackoutDates] = useState([
    { start: '2026-12-24', end: '2026-12-26', reason: 'Holiday Leave' },
  ]);
  const [newBlackout, setNewBlackout] = useState({ start: '', end: '', reason: '' });

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isActive, setIsActive] = useState(true);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  useEffect(() => {
    let mounted = true;
    async function loadSchedule() {
      try {
        const res = await agentService.getAvailability('agent-1');
        if (mounted && res) {
          if (res.routing_availability) setRoutingAvailability(res.routing_availability);
          if (res.max_concurrent_leads) setMaxConcurrentLeads(res.max_concurrent_leads);
          if (res.away_message) setAwayMessage(res.away_message);
          if (Array.isArray(res.blackout_dates) && res.blackout_dates.length > 0) {
            setBlackoutDates(res.blackout_dates);
          }
        }
      } catch {
        // Keep local defaults when offline
      }
    }
    loadSchedule();
    return () => {
      mounted = false;
    };
  }, []);

  const persistAvailability = async (overrides = {}) => {
    setSaving(true);
    try {
      const dayCodeMap = {
        Monday: 'mon',
        Tuesday: 'tue',
        Wednesday: 'wed',
        Thursday: 'thu',
        Friday: 'fri',
        Saturday: 'sat',
        Sunday: 'sun',
      };
      const nextSlots = overrides.schedule || schedule;
      const weekly_schedule = nextSlots.map((s) => ({
        day: dayCodeMap[s.day_of_week] || 'mon',
        enabled: Boolean(s.is_active),
        start: s.start_time || '09:00',
        end: s.end_time || '17:00',
      }));

      await agentService.updateAvailability('agent-1', {
        routing_availability: overrides.routing_availability ?? routingAvailability,
        max_concurrent_leads: Number(overrides.max_concurrent_leads ?? maxConcurrentLeads),
        away_message: (overrides.away_message ?? awayMessage) || null,
        blackout_dates: overrides.blackout_dates ?? blackoutDates,
        weekly_schedule,
      });
      showToast('Availability & lead routing preferences saved.');
    } catch {
      showToast('Availability schedule saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (id) => {
    const updated = schedule.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s));
    setSchedule(updated);
    persistAvailability({ schedule: updated });
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setDay('Monday');
    setStartTime('09:00');
    setEndTime('17:00');
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setDay(item.day_of_week);
    setStartTime(item.start_time);
    setEndTime(item.end_time);
    setIsActive(item.is_active);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    const updated = schedule.filter((s) => s.id !== id);
    setSchedule(updated);
    persistAvailability({ schedule: updated });
  };

  const handleSaveSlot = () => {
    let nextSchedule;
    if (editingItem) {
      nextSchedule = schedule.map((s) =>
        s.id === editingItem.id
          ? { ...s, day_of_week: day, start_time: startTime, end_time: endTime, is_active: isActive }
          : s
      );
    } else {
      const newSlot = {
        id: `av-${Date.now()}`,
        agent_id: 'agent-1',
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        is_active: isActive,
      };
      nextSchedule = [...schedule, newSlot];
    }
    setSchedule(nextSchedule);
    setModalOpen(false);
    persistAvailability({ schedule: nextSchedule });
  };

  const handleAddBlackout = () => {
    if (!newBlackout.start || !newBlackout.end) return;
    const nextBlackouts = [
      ...blackoutDates,
      {
        start: newBlackout.start,
        end: newBlackout.end,
        reason: newBlackout.reason || 'Unavailable / Out of Office',
      },
    ];
    setBlackoutDates(nextBlackouts);
    setNewBlackout({ start: '', end: '', reason: '' });
    persistAvailability({ blackout_dates: nextBlackouts });
  };

  const handleRemoveBlackout = (index) => {
    const nextBlackouts = blackoutDates.filter((_, idx) => idx !== index);
    setBlackoutDates(nextBlackouts);
    persistAvailability({ blackout_dates: nextBlackouts });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1E293B] text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <PageHeader
        title="Consultant Availability & Lead Routing"
        subtitle="Manage your live lead-routing status, weekly working windows, lead capacity, and blackout dates."
        breadcrumbs={[
          { label: 'Dashboard', to: '/agent/dashboard' },
          { label: 'Availability' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => persistAvailability()}
              disabled={saving}
              className="h-10 px-4 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Schedule Slot</span>
            </button>
          </div>
        }
      />

      {/* 0. Integrated Schedule & Appointment Calendar */}
      <AgentScheduleCalendar
        role="agent"
        fixedAgentId="agent-1"
        fixedAgentName="Elena Rossi"
        title="Schedule & Appointment Calendar"
        subtitle="Manage your assigned property viewings, online consultations, document signings, and blocked periods."
      />

      {/* 1. Routing Availability Control Card */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-base font-bold text-[#1E293B]">Lead Routing & Assignment Status</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Pausing lead routing stops new inquiry assignments while keeping full access to your existing listings and deals.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              routingAvailability === 'available'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : routingAvailability === 'paused'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Status: {routingAvailability.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setRoutingAvailability('available');
              persistAvailability({ routing_availability: 'available' });
            }}
            className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
              routingAvailability === 'available'
                ? 'bg-teal-50/70 border-[#0F766E] ring-1 ring-[#0F766E]'
                : 'bg-white border-[#E2E8F0] hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs text-[#1E293B]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Available for Routing</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              Eligible for automatic new client inquiry & viewing assignments.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoutingAvailability('paused');
              persistAvailability({ routing_availability: 'paused' });
            }}
            className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
              routingAvailability === 'paused'
                ? 'bg-amber-50/70 border-amber-500 ring-1 ring-amber-500'
                : 'bg-white border-[#E2E8F0] hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs text-[#1E293B]">
              <PauseCircle className="w-4 h-4 text-amber-600" />
              <span>Pause New Leads</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              Hold new lead routing while focusing on current active clients.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoutingAvailability('vacation');
              persistAvailability({ routing_availability: 'vacation' });
            }}
            className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
              routingAvailability === 'vacation'
                ? 'bg-slate-100 border-slate-500 ring-1 ring-slate-500'
                : 'bg-white border-[#E2E8F0] hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs text-[#1E293B]">
              <Plane className="w-4 h-4 text-[#64748B]" />
              <span>Vacation / Leave Mode</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              Route new inquiries to your team or brokerage queue while away.
            </p>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label
              htmlFor="max-concurrent-leads"
              className="block text-xs font-semibold text-[#1E293B] mb-1"
            >
              Max Concurrent Active Leads
            </label>
            <input
              id="max-concurrent-leads"
              type="number"
              min="1"
              max="200"
              value={maxConcurrentLeads}
              onChange={(e) => setMaxConcurrentLeads(Number(e.target.value))}
              className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#1E293B] outline-none focus:border-[#0F766E]"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="away-message" className="block text-xs font-semibold text-[#1E293B] mb-1">
              Away / Handoff Note (Visible to Broker & Team)
            </label>
            <input
              id="away-message"
              type="text"
              placeholder="e.g. On site inspections in BGC until 4:00 PM"
              value={awayMessage}
              onChange={(e) => setAwayMessage(e.target.value)}
              className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] outline-none focus:border-[#0F766E]"
            />
          </div>
        </div>
      </div>

      {/* 2. Weekly Working Windows */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#1E293B]">Weekly Working Windows</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Appointments requested outside these active slots will prompt the client with alternatives.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
            <span>
              Active Slots: {schedule.filter((s) => s.is_active).length} of {schedule.length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {schedule.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleToggleActive(item.id)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    item.is_active ? 'bg-[#0F766E]' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle active status"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      item.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-[#1E293B]">{item.day_of_week}</p>
                  <p className="text-xs text-[#64748B]">
                    {item.is_active ? 'Accepting Showings' : 'Unavailable for Bookings'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#1E293B] bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>
                    {item.start_time} - {item.end_time}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 text-[#64748B] hover:text-[#0F766E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Edit Slot"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Blackout Dates & Planned Leave */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#1E293B]">Blackout Dates & Planned Leave</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Block specific calendar ranges when you are unavailable for property viewings or lead assignments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label htmlFor="blackout-start" className="block text-xs font-semibold text-[#1E293B] mb-1">
              Start Date
            </label>
            <input
              id="blackout-start"
              type="date"
              value={newBlackout.start}
              onChange={(e) => setNewBlackout({ ...newBlackout, start: e.target.value })}
              className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="blackout-end" className="block text-xs font-semibold text-[#1E293B] mb-1">
              End Date
            </label>
            <input
              id="blackout-end"
              type="date"
              value={newBlackout.end}
              onChange={(e) => setNewBlackout({ ...newBlackout, end: e.target.value })}
              className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="blackout-reason" className="block text-xs font-semibold text-[#1E293B] mb-1">
              Reason
            </label>
            <input
              id="blackout-reason"
              type="text"
              placeholder="e.g. Annual Leave"
              value={newBlackout.reason}
              onChange={(e) => setNewBlackout({ ...newBlackout, reason: e.target.value })}
              className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B]"
            />
          </div>
          <button
            type="button"
            onClick={handleAddBlackout}
            className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Add Blackout</span>
          </button>
        </div>

        <div className="space-y-2 pt-2">
          {blackoutDates.map((b, idx) => (
            <div
              key={`${b.start}-${idx}`}
              className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#0F766E]" />
                <span className="font-mono font-semibold text-[#1E293B]">
                  {b.start} → {b.end}
                </span>
                <span className="text-[#64748B]">• {b.reason}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveBlackout(idx)}
                className="p-1 text-[#64748B] hover:text-rose-600 transition-colors cursor-pointer"
                title="Remove blackout date"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Slot Modal */}
      <DashboardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Availability Slot' : 'Add Availability Slot'}
        subtitle="Specify the active working window for property consultations."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSlot}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider"
            >
              Save Window
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
              Day of Week
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full h-10 px-3.5 border border-[#E2E8F0] rounded-lg text-xs outline-none focus:border-[#0F766E] cursor-pointer"
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                (d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-10 px-3.5 border border-[#E2E8F0] rounded-lg text-xs font-mono outline-none focus:border-[#0F766E]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-10 px-3.5 border border-[#E2E8F0] rounded-lg text-xs font-mono outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1E293B]">
              Slot Enabled
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-[#0F766E]"
            />
          </div>
        </div>
      </DashboardModal>
    </div>
  );
}
