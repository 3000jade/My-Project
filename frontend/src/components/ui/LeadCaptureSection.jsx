import { useState } from 'react';
import { inquiryService } from '../../services/inquiryService';

export default function LeadCaptureSection() {
  const [tourType, setTourType] = useState('in-person'); // 'in-person' | 'virtual'
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    try {
      await inquiryService.submitInquiry({
        name,
        email,
        phone,
        message: notes || `Private tour requested (${tourType}) on ${selectedDate || 'flexible date'} at ${selectedTime || 'flexible time'}.`,
        preferredDate: selectedDate,
        type: 'tour',
      });
    } catch (err) {
      console.warn('Lead capture submission error:', err.message);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <section className="w-full bg-[#ffffff] py-20 border-b border-[#e5e5df]">
      <div className="w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">
        
        <div className="bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] p-8 md:p-14 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Narrative */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1b4d4b] font-sans">
                PRIVATE RESERVATION
              </span>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#0f1722] tracking-tight font-sans">
                Schedule a Private Walkthrough
              </h2>
              <p className="text-gray-600 text-sm font-sans leading-relaxed">
                Experience this extraordinary sanctuary firsthand. Select your preferred date and format for a confidential private tour with senior listing advisory.
              </p>

              <div className="space-y-4 pt-2 font-sans text-xs">
                <div className="flex items-center gap-3 text-[#0f1722]">
                  <div className="w-8 h-8 rounded-full bg-[#1b4d4b]/10 text-[#1b4d4b] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  </div>
                  <span className="font-semibold">100% Confidential Discovery Call</span>
                </div>
                <div className="flex items-center gap-3 text-[#0f1722]">
                  <div className="w-8 h-8 rounded-full bg-[#1b4d4b]/10 text-[#1b4d4b] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">key</span>
                  </div>
                  <span className="font-semibold">Access to Off-Market Portfolio Dossiers</span>
                </div>
                <div className="flex items-center gap-3 text-[#0f1722]">
                  <div className="w-8 h-8 rounded-full bg-[#1b4d4b]/10 text-[#1b4d4b] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">support_agent</span>
                  </div>
                  <span className="font-semibold">Dedicated 24/7 Elite Advisory Concierge</span>
                </div>
              </div>
            </div>

            {/* Right Form */}
            <div className="lg:col-span-7 bg-[#ffffff] rounded-[4px] border border-[#e5e5df] p-6 md:p-8 shadow-sm">
              {isSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#1b4d4b]/10 text-[#1b4d4b] flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-3xl">check_circle</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-[#0f1722] font-sans">Tour Request Received</h3>
                  <p className="text-sm text-gray-600 font-sans max-w-md mx-auto">
                    Thank you, {name}. A senior advisor from our private client team will reach out within 2 hours to confirm your walkthrough schedule.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Tour Type Selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTourType('in-person')}
                      className={`h-[48px] text-xs font-semibold uppercase tracking-wider rounded-[4px] border transition-all flex items-center justify-center gap-2 ${
                        tourType === 'in-person'
                          ? 'bg-[#1b4d4b] text-white border-[#1b4d4b]'
                          : 'bg-[#f9f9f7] text-gray-700 border-[#e5e5df]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">person_pin_circle</span>
                      In-Person Tour
                    </button>
                    <button
                      type="button"
                      onClick={() => setTourType('virtual')}
                      className={`h-[48px] text-xs font-semibold uppercase tracking-wider rounded-[4px] border transition-all flex items-center justify-center gap-2 ${
                        tourType === 'virtual'
                          ? 'bg-[#1b4d4b] text-white border-[#1b4d4b]'
                          : 'bg-[#f9f9f7] text-gray-700 border-[#e5e5df]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">videocam</span>
                      Virtual Live Tour
                    </button>
                  </div>

                  {/* Date & Time Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1.5 font-sans">PREFERRED DATE</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full h-[54px] bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] px-4 font-sans text-sm outline-none focus:border-[#1b4d4b]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1.5 font-sans">TIME SLOT</label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full h-[54px] bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] px-4 font-sans text-sm outline-none focus:border-[#1b4d4b]"
                      >
                        <option value="">Select Time</option>
                        <option value="10:00 AM">10:00 AM PST</option>
                        <option value="01:00 PM">01:00 PM PST</option>
                        <option value="04:00 PM">04:00 PM PST</option>
                      </select>
                    </div>
                  </div>

                  {/* Personal Contact Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1.5 font-sans">FULL NAME *</label>
                      <input
                        type="text"
                        required
                        placeholder="Alexander Sterling"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-[54px] bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] px-4 font-sans text-sm outline-none focus:border-[#1b4d4b]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1.5 font-sans">EMAIL ADDRESS *</label>
                      <input
                        type="email"
                        required
                        placeholder="alexander@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[54px] bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] px-4 font-sans text-sm outline-none focus:border-[#1b4d4b]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1.5 font-sans">PHONE NUMBER</label>
                    <input
                      type="tel"
                      placeholder="+1 (310) 555-0192"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-[54px] bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] px-4 font-sans text-sm outline-none focus:border-[#1b4d4b]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1.5 font-sans">CONFIDENTIAL NOTES / REQUESTS</label>
                    <textarea
                      rows="3"
                      placeholder="Specify any special architectural questions or scheduling needs..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] p-4 font-sans text-sm outline-none focus:border-[#1b4d4b] resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-[54px] bg-[#e28468] hover:bg-[#c9684b] text-white font-sans font-semibold text-xs tracking-wider uppercase rounded-[4px] transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isSubmitting ? 'animate-spin' : ''}`}>
                      {isSubmitting ? 'sync' : 'send'}
                    </span>
                    <span>{isSubmitting ? 'Transmitting Request...' : 'Confirm Showing Request'}</span>
                  </button>

                </form>
              )}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
