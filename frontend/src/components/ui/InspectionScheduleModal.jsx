import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InspectionScheduleModal({
  isOpen,
  onClose,
  property,
  onScheduleSuccess
}) {
  const [selectedDate, setSelectedDate] = useState('2026-09-20');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [targetMoveIn, setTargetMoveIn] = useState('Within 30 Days');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !property) return null;

  const timeSlots = [
    '09:00 AM - 11:00 AM',
    '10:00 AM - 12:00 PM',
    '01:00 PM - 03:00 PM',
    '04:00 PM - 06:00 PM'
  ];

  const moveInWindows = [
    'Immediate',
    'Within 30 Days',
    'Within 60 Days',
    'Flexible / Pre-selling'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      event: 'DISPATCH_INSPECTION_ROUTING',
      listing_id: property.id,
      reference_code: property.ref_code || 'MLSPH91M99LRH7',
      property_title: property.title,
      assigned_agent: property.agent?.name || 'Jayson Canonico',
      agent_name: property.agent?.name || 'Jayson Canonico',
      scheduled_date: selectedDate,
      time_slot: selectedTimeSlot,
      target_move_in: targetMoveIn,
      full_name: fullName,
      phone,
      email,
      notes,
      timestamp: new Date().toISOString()
    };

    console.log('[Automated Broker Routing] Inspection lead dispatched:', payload);
    setIsSubmitted(true);

    if (onScheduleSuccess) {
      onScheduleSuccess(payload);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-hidden"
        onClick={handleResetAndClose}
      >
        <motion.div
          className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
          initial={{ y: 100, scale: 0.9, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 100, scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          data-lenis-prevent="true"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-start justify-between bg-zinc-50 dark:bg-zinc-800/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                  Free Site Viewing
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono font-bold">
                  {property.ref_code || 'MLSPH91M99LRH7'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                Schedule Free Site Viewing
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                {property.title} • {property.development || 'Urban Deca Homes Ortigas'}
              </p>
            </div>

            {/* Standard w-9 h-9 white circular close button */}
            <button
              onClick={handleResetAndClose}
              className="w-9 h-9 bg-white text-black shadow-lg rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-gray-100"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[18px] font-bold">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6" data-lenis-prevent="true">
            {isSubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Site Viewing Request Confirmed!</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-md mx-auto">
                    Your appointment coordinates have been routed to assigned agent <strong>{property.agent?.name || 'Jayson Canonico'}</strong>. You will receive an SMS and WhatsApp confirmation shortly.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-800/60 rounded-2xl p-4 text-left text-xs space-y-1.5 border border-gray-200 dark:border-zinc-700 max-w-md mx-auto">
                  <p><strong className="text-gray-700 dark:text-gray-300">Target Date:</strong> {selectedDate} ({selectedTimeSlot})</p>
                  <p><strong className="text-gray-700 dark:text-gray-300">Move-in Window:</strong> {targetMoveIn}</p>
                  <p><strong className="text-gray-700 dark:text-gray-300">Attendee:</strong> {fullName} ({phone})</p>
                  <p><strong className="text-gray-700 dark:text-gray-300">Listing Ref:</strong> {property.ref_code || 'MLSPH91M99LRH7'}</p>
                </div>

                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="h-[54px] px-8 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl transition-all shadow-md"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Assigned Brokerage Information */}
                <div className="flex items-center gap-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-3.5">
                  <img
                    src={property.agent?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt={property.agent?.name || 'Jayson Canonico'}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-gray-900 dark:text-white">
                      Assigned Agent: {property.agent?.name || 'Jayson Canonico'}
                    </p>
                    <p className="text-amber-700 dark:text-amber-400 font-medium">
                      {property.agent?.title || 'Real Estate Agent'} • Verified Partner
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Direct broker routing: automated instant calendar lock.
                    </p>
                  </div>
                </div>

                {/* Target Move-In Window (Section 7) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                    Target Move-In Window
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {moveInWindows.map(window => (
                      <button
                        key={window}
                        type="button"
                        onClick={() => setTargetMoveIn(window)}
                        className={`h-[54px] px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                          targetMoveIn === window
                            ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700'
                        }`}
                      >
                        {window}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inspection Date & Time Slot */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="schedule-date" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Date
                    </label>
                    <input
                      id="schedule-date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full h-[54px] px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="time-slot" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Time Slot
                    </label>
                    <select
                      id="time-slot"
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="w-full h-[54px] px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Client Information */}
                <div className="space-y-3">
                  <div>
                    <label htmlFor="full-name" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      id="full-name"
                      type="text"
                      placeholder="e.g., Maria Santos"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-[54px] px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="phone-number" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                        Mobile Number
                      </label>
                      <input
                        id="phone-number"
                        type="tel"
                        placeholder="09XX XXX XXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-[54px] px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email-address" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                        Email (Optional)
                      </label>
                      <input
                        id="email-address"
                        type="email"
                        placeholder="maria@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[54px] px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      Notes / Questions
                    </label>
                    <textarea
                      id="notes"
                      rows={2}
                      placeholder="e.g., We are interested in Pag-IBIG loan requirements and 6th floor orientation."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full h-[54px] rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-600/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  Confirm Free Site Viewing
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
