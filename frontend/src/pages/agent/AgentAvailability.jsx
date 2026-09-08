import React, { useState } from 'react';
import PageHeader from '../../components/dashboard/PageHeader';
import DashboardModal from '../../components/dashboard/DashboardModal';
import { mockAvailability } from '../../mockData/mockAvailability';

export default function AgentAvailability() {
  const [schedule, setSchedule] = useState(mockAvailability);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isActive, setIsActive] = useState(true);

  const handleToggleActive = (id) => {
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s));
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
    setSchedule(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveSlot = () => {
    if (editingItem) {
      setSchedule(prev => prev.map(s =>
        s.id === editingItem.id
          ? { ...s, day_of_week: day, start_time: startTime, end_time: endTime, is_active: isActive }
          : s
      ));
    } else {
      const newSlot = {
        id: `av-${Date.now()}`,
        agent_id: 'agent-1',
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        is_active: isActive
      };
      setSchedule(prev => [...prev, newSlot]);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Consultant Availability"
        subtitle="Configure weekly working windows for client site showings and AI-assisted viewing bookings."
        breadcrumbs={[
          { label: "Dashboard", to: "/agent/dashboard" },
          { label: "Availability" }
        ]}
        actions={
          <button
            onClick={handleOpenAdd}
            className="h-[46px] px-5 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add Schedule Slot
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-display font-bold text-[#174849]">
              Weekly Working Windows
            </h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              Appointments requested outside these active slots will prompt the client with alternatives.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-[#266F71]" />
            <span>Active Slots: {schedule.filter(s => s.is_active).length} of {schedule.length}</span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {schedule.map((item) => (
            <div
              key={item.id}
              className="p-5 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleToggleActive(item.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    item.is_active ? 'bg-[#266F71]' : 'bg-gray-300'
                  }`}
                  aria-label="Toggle active status"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      item.is_active ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div>
                  <p className="font-bold text-sm text-[#174849] font-sans">
                    {item.day_of_week}
                  </p>
                  <p className="text-xs text-gray-500 font-sans">
                    {item.is_active ? 'Accepting Showings' : 'Unavailable for Bookings'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm font-sans font-medium text-gray-700 bg-[#F1F0EC]/70 px-4 py-2 rounded-xl">
                  <span className="material-symbols-outlined text-[18px] text-[#266F71]">schedule</span>
                  <span>{item.start_time} - {item.end_time}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 text-gray-500 hover:text-[#266F71] hover:bg-[#F1F0EC] rounded-lg transition-colors"
                    title="Edit Slot"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Slot"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <DashboardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Edit Availability Slot" : "Add Availability Slot"}
        subtitle="Specify the active working window for property consultations."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 font-sans"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSlot}
              className="px-5 py-2 bg-[#266F71] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans"
            >
              Save Window
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 font-sans">Day of Week</label>
            <select
              value={day}
              onChange={e => setDay(e.target.value)}
              className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-[#266F71] cursor-pointer"
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 font-sans">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-[#266F71]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 font-sans">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-[#266F71]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F1F0EC] rounded-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#174849] font-sans">Slot Enabled</span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="w-5 h-5 accent-[#266F71]"
            />
          </div>
        </div>
      </DashboardModal>
    </div>
  );
}
