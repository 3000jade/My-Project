import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Search, 
  Clock, 
  Building2, 
  MessageSquare, 
  Send, 
  ExternalLink, 
  CheckCircle, 
  User, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import { clientUserService } from '../../../services/clientUserService';

export default function ClientInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Inquiry Detail Modal
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadInquiries() {
      try {
        const list = await clientUserService.getClientInquiries();
        if (mounted) setInquiries(list);
      } catch (err) {
        console.warn('Failed to load client inquiries:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadInquiries();
    return () => { mounted = false; };
  }, []);

  const handleOpenDetail = (inquiry) => {
    setSelectedInquiry(inquiry);
    setReplyText('');
    setDetailModalOpen(true);
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedInquiry) return;

    setSendingReply(true);
    try {
      const updated = await clientUserService.addInquiryMessage(selectedInquiry.id, replyText.trim());
      setSelectedInquiry(updated);
      setInquiries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setReplyText('');
    } catch (err) {
      console.warn('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const propTitle = inq.property_title || '';
    const lastMsg = inq.last_message || '';
    const q = searchQuery.toLowerCase();
    const matchesSearch = propTitle.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || (inq.status || '').toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans antialiased text-[#141717]">
      <PageHeader
        title="My Inquiries"
        subtitle="Track submitted questions, viewing consultations, and private correspondence with senior portfolio agents."
      />

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#D8DFDF] flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inquiries by property or message keyword..."
            className="w-full h-[46px] pl-10 pr-4 rounded-lg bg-[#FBFBF9] border border-[#D8DFDF] focus:bg-white focus:border-[#0D4446] text-xs outline-none transition-colors"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', 'NEW', 'ASSIGNED', 'SCHEDULED', 'RESOLVED'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                statusFilter === status
                  ? 'bg-[#0D4446] text-white shadow-xs'
                  : 'bg-[#FBFBF9] text-[#5C6768] hover:bg-[#F4F5F4]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries Ledger Cards */}
      {filteredInquiries.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#D8DFDF] space-y-3">
          <Mail className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-display font-bold text-[#141717]">No inquiries found</h3>
          <p className="text-xs text-[#5C6768] max-w-md mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No inquiries match your current filters. Try resetting search criteria.'
              : 'You have not submitted any property inquiries yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inq) => (
            <div
              key={inq.id}
              className="bg-white rounded-2xl border border-[#D8DFDF] hover:border-[#0D4446]/40 p-5 transition-all shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Ref #{inq.id}
                  </span>
                  <StatusBadge status={inq.status || 'NEW'} />
                  <span className="text-[11px] font-mono text-[#5C6768] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {inq.created_at || 'Recent'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0D4446] shrink-0" />
                  <h4 className="text-sm sm:text-base font-display font-bold text-[#141717] truncate">
                    {inq.property_title}
                  </h4>
                  {inq.property_price && (
                    <span className="text-xs font-mono font-bold text-[#E76F51] shrink-0">
                      • {inq.property_price}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#5C6768] line-clamp-2 bg-[#FBFBF9] p-3 rounded-xl border border-[#E5EBEB] leading-relaxed">
                  "{inq.last_message}"
                </p>

                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>Assigned Concierge: <strong className="text-[#0D4446]">{inq.agent_name || 'Elena Rossi'}</strong></span>
                  <span>•</span>
                  <span>{inq.messages?.length || 1} correspondence exchange(s)</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(inq)}
                  className="h-[44px] px-5 bg-[#0D4446] hover:bg-[#083335] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>View Details & Thread</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inquiry Detail & Message Thread Modal */}
      <DashboardModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedInquiry?.property_title || 'Inquiry Dossier'}
        subtitle={`Reference #${selectedInquiry?.id} • Assigned to ${selectedInquiry?.agent_name || 'Elena Rossi'}`}
      >
        {selectedInquiry && (
          <div className="space-y-6">
            {/* Property Summary Strip */}
            <div className="p-4 bg-[#FBFBF9] rounded-xl border border-[#E5EBEB] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#5C6768] block">Property Asset</span>
                <h4 className="text-xs sm:text-sm font-bold text-[#141717]">{selectedInquiry.property_title}</h4>
                <span className="text-xs font-mono font-bold text-[#E76F51]">{selectedInquiry.property_price}</span>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedInquiry.status || 'NEW'} />
                <span className="text-[10px] font-mono text-slate-400 block mt-1">{selectedInquiry.created_at}</span>
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="space-y-3">
              <h5 className="text-xs font-mono uppercase font-bold text-[#5C6768] tracking-wider">
                Consultation Thread
              </h5>
              
              <div 
                className="max-h-64 overflow-y-auto space-y-3 p-3 bg-white rounded-xl border border-[#E5EBEB]"
                data-lenis-prevent="true"
              >
                {selectedInquiry.messages && selectedInquiry.messages.length > 0 ? (
                  selectedInquiry.messages.map((msg, idx) => {
                    const isClient = msg.sender === 'client';
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isClient
                              ? 'bg-[#0D4446] text-white rounded-br-xs'
                              : 'bg-[#F4F5F4] text-[#141717] rounded-bl-xs border border-[#E5EBEB]'
                          }`}
                        >
                          <p className="font-semibold text-[11px] mb-1 opacity-80">
                            {msg.sender_name || (isClient ? 'You' : selectedInquiry.agent_name)}
                          </p>
                          <p>{msg.content}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 mt-1 px-1">
                          {msg.timestamp || 'Recent'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 p-2 text-center">No recorded messages.</p>
                )}
              </div>
            </div>

            {/* Send Follow-up Message Form */}
            <form onSubmit={handleSendReply} className="space-y-3">
              <label className="text-xs font-semibold text-[#141717] block">
                Send Follow-up Message
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type an additional question or schedule update..."
                  className="flex-1 h-[54px] px-4 rounded-xl border border-[#D8DFDF] bg-[#FBFBF9] focus:bg-white focus:border-[#0D4446] text-xs outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="h-[54px] px-6 rounded-xl bg-[#0D4446] hover:bg-[#083335] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </form>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="h-[42px] px-5 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </DashboardModal>
    </div>
  );
}
