import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../components/dashboard/PageHeader';
import StatusBadge from '../../components/dashboard/StatusBadge';
import DashboardModal from '../../components/dashboard/DashboardModal';
import { mockInquiries } from '../../mockData/mockInquiries';

export default function AgentInquiryDetail() {
  const { id } = useParams();
  const initialInquiry = mockInquiries.find(i => i.id === id) || mockInquiries[0];

  const [inquiry, setInquiry] = useState(initialInquiry);
  const [replyText, setReplyText] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('2026-09-10');
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [appointmentType, setAppointmentType] = useState('Site Visit');
  const [appointmentConfirmedMessage, setAppointmentConfirmedMessage] = useState(false);

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: "agent",
      sender_name: "Elena Rossi",
      timestamp: "Just now",
      content: replyText.trim()
    };

    setInquiry(prev => ({
      ...prev,
      messages: [...prev.messages, newMsg],
      last_message: replyText.trim()
    }));
    setReplyText('');
  };

  const handleStatusChange = (newStatus) => {
    setInquiry(prev => ({ ...prev, status: newStatus }));
  };

  const handleCreateAppointment = () => {
    setAppointmentConfirmedMessage(true);
    setTimeout(() => {
      setAppointmentConfirmedMessage(false);
      setShowAppointmentModal(false);
    }, 1800);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={`Inquiry from ${inquiry.client_name}`}
        subtitle={`Inquiry Ref: ${inquiry.id} • Created ${inquiry.created_at}`}
        breadcrumbs={[
          { label: "Dashboard", to: "/agent/dashboard" },
          { label: "Inquiries", to: "/agent/inquiries" },
          { label: inquiry.client_name }
        ]}
        badge={<StatusBadge status={inquiry.status} />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAppointmentModal(true)}
              className="h-[46px] px-4 bg-[#FB8E5D] hover:bg-[#d96b37] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              Coordinate Appointment
            </button>

            {inquiry.status !== 'RESOLVED' ? (
              <button
                onClick={() => handleStatusChange('RESOLVED')}
                className="h-[46px] px-4 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Mark Resolved
              </button>
            ) : (
              <button
                onClick={() => handleStatusChange('REOPENED')}
                className="h-[46px] px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                Reopen Inquiry
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Context & Chat History */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Context Card */}
          {inquiry.ai_summary && (
            <div className="bg-gradient-to-br from-white to-[#266F71]/5 rounded-2xl border border-[#266F71]/30 p-5 shadow-xs">
              <div className="flex items-center gap-2.5 text-[#266F71] mb-2 font-display font-bold text-sm">
                <span className="material-symbols-outlined text-[22px]">smart_toy</span>
                <span>AI Property Inquiry Assistance Summary</span>
              </div>
              <p className="text-xs font-sans text-gray-700 leading-relaxed">
                {inquiry.ai_summary}
              </p>
            </div>
          )}

          {/* Conversation History */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col h-[520px]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 font-sans pb-3 border-b border-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#266F71]">forum</span>
              Conversation History
            </h3>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar" data-lenis-prevent="true">
              {inquiry.messages.map((msg) => {
                const isAgent = msg.sender === 'agent';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-gray-500 font-sans">
                        {msg.sender_name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-sans">
                        {msg.timestamp}
                      </span>
                    </div>
                    <div
                      className={`max-w-md p-4 rounded-2xl text-sm font-sans leading-relaxed ${
                        isAgent
                          ? 'bg-[#266F71] text-white rounded-tr-xs shadow-xs'
                          : 'bg-[#F1F0EC] text-gray-800 rounded-tl-xs'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Bar */}
            <form onSubmit={handleSendReply} className="pt-4 border-t border-gray-100 flex gap-3 items-center">
              <input
                type="text"
                placeholder="Type your message to the client..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 h-[54px] px-4 bg-[#F1F0EC]/60 border border-gray-200 rounded-xl text-sm font-sans focus:border-[#266F71] focus:bg-white outline-none"
              />
              <button
                type="submit"
                className="h-[54px] px-6 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Send</span>
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Client & Property Metadata */}
        <div className="space-y-6">
          {/* Client Details */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
              Client Details
            </h3>
            <div className="space-y-3 font-sans text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#266F71]/10 text-[#266F71] flex items-center justify-center font-bold">
                  {inquiry.client_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-[#174849]">{inquiry.client_name}</p>
                  <p className="text-xs text-gray-400">Prospective Client</p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span className="text-gray-400">Email:</span>
                  <span className="font-medium text-gray-800">{inquiry.client_email}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span className="text-gray-400">Phone:</span>
                  <span className="font-medium text-gray-800">{inquiry.client_phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Property Reference */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">
              Property Referenced
            </h3>
            <div className="space-y-2">
              <p className="font-bold text-[#174849] font-sans text-base">
                {inquiry.property_title}
              </p>
              <p className="text-sm font-bold font-display text-[#266F71]">
                {inquiry.property_price}
              </p>
              <Link
                to={`/agent/properties/${inquiry.property_id}`}
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#266F71] hover:text-[#174849] pt-2 font-sans"
              >
                <span>View Listing Page</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Coordinate Appointment Modal */}
      <DashboardModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        title="Coordinate Client Appointment"
        subtitle={`Schedule a viewing or consultation with ${inquiry.client_name}`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowAppointmentModal(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 font-sans"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAppointment}
              className="px-6 py-2.5 bg-[#266F71] hover:bg-[#174849] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-colors"
            >
              Confirm Schedule
            </button>
          </div>
        }
      >
        {appointmentConfirmedMessage ? (
          <div className="p-6 text-center space-y-2">
            <span className="material-symbols-outlined text-[48px] text-[#266F71]">check_circle</span>
            <h4 className="text-lg font-bold font-display text-[#174849]">Appointment Scheduled</h4>
            <p className="text-xs text-gray-500 font-sans">
              Viewing coordinates registered for {appointmentDate} at {appointmentTime}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Appointment Type</label>
              <select
                value={appointmentType}
                onChange={e => setAppointmentType(e.target.value)}
                className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-[#266F71] cursor-pointer"
              >
                <option value="Site Visit">Site Visit / Ocular Tour</option>
                <option value="Online Consultation">Online Consultation (Zoom / Teams)</option>
                <option value="Document Signing">Document Signing</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Date</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={e => setAppointmentDate(e.target.value)}
                  className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-[#266F71]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Time</label>
                <input
                  type="text"
                  value={appointmentTime}
                  onChange={e => setAppointmentTime(e.target.value)}
                  className="w-full h-[54px] px-4 border border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-[#266F71]"
                />
              </div>
            </div>
          </div>
        )}
      </DashboardModal>
    </div>
  );
}
