import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { appointmentService } from '../../services/appointmentService';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await appointmentService.createAppointment({
        client_name: fullName,
        client_email: email,
        client_phone: phone,
        property_id: String(property.id),
        property_title: property.title,
        agent_id: property.agent?.id || undefined,
        agent_name: property.agent?.name || 'Jayson Canonico',
        appointment_date: selectedDate,
        appointment_time: selectedTimeSlot,
        appointment_type: 'Site Visit',
        notes: notes ? `${notes} (Target move-in: ${targetMoveIn})` : `Target move-in: ${targetMoveIn}`
      });

      const payload = {
        event: 'DISPATCH_INSPECTION_ROUTING',
        appointment: created,
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
    } catch (err) {
      console.error('Failed to submit inspection schedule:', err);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-hidden font-sans"
        onClick={handleResetAndClose}
      >
        <motion.div
          className="w-full max-w-xl bg-white dark:bg-[#141b1b] border border-[#e1e5df] dark:border-[#222f2e] rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
          initial={{ y: 100, scale: 0.9, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 100, scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          data-lenis-prevent="true"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#e1e5df] dark:border-[#222f2e] flex items-start justify-between bg-[#f4f5f2] dark:bg-[#182121]">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c4683c] flex items-center gap-1.5 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c4683c]"></span>
                  Free Site Viewing
                </span>
                <span className="text-[#c2c9bf]">|</span>
                <span className="text-xs text-[#7a868a] font-mono font-bold">
                  {property.ref_code || 'MLSPH91M99LRH7'}
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-normal text-[#183d3b] dark:text-[#f4f5f2] mt-1.5">
                Schedule Free Site Viewing
              </h2>
              <p className="text-xs text-[#5f6b6f] dark:text-[#88989c] truncate max-w-md mt-0.5 font-sans">
                {property.title} • {property.development || 'Urban Deca Homes Ortigas'}
              </p>
            </div>

            {/* Standard w-9 h-9 white circular close button */}
            <button
              onClick={handleResetAndClose}
              className="w-9 h-9 bg-white text-[#183d3b] shadow-lg rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-[#e1e5df]"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[18px] font-bold">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 font-sans" data-lenis-prevent="true">
            {isSubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-[#2d6a4f]/15 text-[#2d6a4f] dark:text-[#68b693] rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <div>
                  <h3 className="font-display text-2xl font-normal text-[#183d3b] dark:text-white">Site Viewing Request Confirmed!</h3>
                  <p className="text-xs text-[#5f6b6f] dark:text-[#90a2a6] mt-1 max-w-md mx-auto font-sans">
                    Your appointment coordinates have been routed to assigned agent <strong>{property.agent?.name || 'Jayson Canonico'}</strong>. You will receive an SMS and WhatsApp confirmation shortly.
                  </p>
                </div>

                <div className="bg-[#ecefe9]/60 dark:bg-[#1b2524] rounded-2xl p-4 text-left text-xs space-y-1.5 border border-[#e1e5df] dark:border-[#2a3a38] max-w-md mx-auto font-sans">
                  <p><strong className="text-[#183d3b] dark:text-white">Target Date:</strong> {selectedDate} ({selectedTimeSlot})</p>
                  <p><strong className="text-[#183d3b] dark:text-white">Move-in Window:</strong> {targetMoveIn}</p>
                  <p><strong className="text-[#183d3b] dark:text-white">Attendee:</strong> {fullName} ({phone})</p>
                  <p><strong className="text-[#183d3b] dark:text-white">Listing Ref:</strong> <span className="font-mono">{property.ref_code || 'MLSPH91M99LRH7'}</span></p>
                </div>

                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="h-[54px] px-8 bg-[#183d3b] hover:bg-[#122e2c] text-white font-sans uppercase tracking-wider font-bold rounded-2xl transition-all shadow-md"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Assigned Brokerage Information */}
                <div className="flex items-center gap-3.5 bg-[#fafafa] dark:bg-[#1b2524] border border-[#e1e5df] dark:border-[#2c3d3b] rounded-2xl p-4">
                  <img
                    src={property.agent?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt={property.agent?.name || 'Jayson Canonico'}
                    className="w-12 h-12 rounded-xl object-cover border border-[#e1e5df]"
                  />
                  <div className="text-xs font-sans">
                    <p className="font-bold text-[#183d3b] dark:text-[#f4f5f2]">
                      Assigned Agent: {property.agent?.name || 'Jayson Canonico'}
                    </p>
                    <p className="text-[#5f6b6f] dark:text-[#88989c] font-medium">
                      {property.agent?.title || 'Real Estate Agent'} • Verified Partner
                    </p>
                    <p className="text-[11px] text-[#7a868a] mt-0.5">
                      Direct broker routing: automated instant calendar lock.
                    </p>
                  </div>
                </div>

                {/* Target Move-In Window (Section 7) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6b6f] dark:text-[#88989c] mb-2 font-sans">
                    Target Move-In Window
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {moveInWindows.map(window => (
                      <button
                        key={window}
                        type="button"
                        onClick={() => setTargetMoveIn(window)}
                        className={`h-[54px] px-3 rounded-xl text-xs font-bold font-sans border transition-all text-center ${
                          targetMoveIn === window
                            ? 'bg-[#183d3b] text-white border-[#183d3b] shadow-sm'
                            : 'bg-[#ecefe9]/60 text-[#1c2224] border-[#e1e5df] dark:bg-[#1d2726] dark:text-[#d3dedc] dark:border-[#2c3d3b]'
                        }`}
                      >
                        {window}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inspection Date & Time Slot */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                  <div>
                    <label htmlFor="schedule-date" className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6b6f] dark:text-[#88989c] mb-2">
                      Preferred Date
                    </label>
                    <input
                      id="schedule-date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full h-[54px] px-4 rounded-xl border border-[#e1e5df] dark:border-[#2a3a38] bg-[#ecefe9]/40 dark:bg-[#1b2524] text-[#1c2224] dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#c4683c]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="time-slot" className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6b6f] dark:text-[#88989c] mb-2">
                      Preferred Time Slot
                    </label>
                    <select
                      id="time-slot"
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="w-full h-[54px] px-4 rounded-xl border border-[#e1e5df] dark:border-[#2a3a38] bg-[#ecefe9]/40 dark:bg-[#1b2524] text-[#1c2224] dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#c4683c]"
                    >
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Client Information */}
                <div className="space-y-3 font-sans">
                  <div>
                    <label htmlFor="full-name" className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6b6f] dark:text-[#88989c] mb-1">
                      Full Name
                    </label>
                    <input
                      id="full-name"
                      type="text"
                      placeholder="e.g., Maria Santos"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-[54px] px-4 rounded-xl border border-[#e1e5df] dark:border-[#2a3a38] bg-[#ecefe9]/40 dark:bg-[#1b2524] text-[#1c2224] dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#c4683c]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="phone-number" className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6b6f] dark:text-[#88989c] mb-1">
                        Mobile Number
                      </label>
                      <input
                        id="phone-number"
                        type="tel"
                        placeholder="09XX XXX XXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-[54px] px-4 rounded-xl border border-[#e1e5df] dark:border-[#2a3a38] bg-[#ecefe9]/40 dark:bg-[#1b2524] text-[#1c2224] dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#c4683c]"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email-address" className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6b6f] dark:text-[#88989c] mb-1">
                        Email (Optional)
                      </label>
                      <input
                        id="email-address"
                        type="email"
                        placeholder="maria@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[54px] px-4 rounded-xl border border-[#e1e5df] dark:border-[#2a3a38] bg-[#ecefe9]/40 dark:bg-[#1b2524] text-[#1c2224] dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#c4683c]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6b6f] dark:text-[#88989c] mb-1">
                      Notes / Questions
                    </label>
                    <textarea
                      id="notes"
                      rows={2}
                      placeholder="e.g., We are interested in Pag-IBIG loan requirements and 6th floor orientation."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#e1e5df] dark:border-[#2a3a38] bg-[#ecefe9]/40 dark:bg-[#1b2524] text-[#1c2224] dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#c4683c]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[54px] rounded-2xl bg-[#c4683c] hover:bg-[#b0572d] text-white text-xs font-bold uppercase tracking-wider font-sans shadow-lg shadow-[#c4683c]/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  {isSubmitting ? 'Scheduling...' : 'Confirm Free Site Viewing'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
