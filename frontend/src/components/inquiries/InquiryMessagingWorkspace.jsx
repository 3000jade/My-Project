import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Send,
  PanelRightOpen,
  PanelRightClose,
  ArrowLeft,
  Building2,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import StatusBadge from '../dashboard/StatusBadge';
import EmptyState from '../dashboard/EmptyState';
import { TableSkeleton } from '../dashboard/skeletons';
import InquirySourceBadge from './InquirySourceBadge';
import SlaCountdownPill from './SlaCountdownPill';
import AiQualificationPanel from './AiQualificationPanel';
import InternalNotesRail from './InternalNotesRail';

export default function InquiryMessagingWorkspace({
  role = 'agent',
  inquiries = [],
  selectedId,
  onSelectInquiry,
  loading = false,
  search = '',
  onSearchChange,
  tabs = [],
  activeTab = 'ALL',
  onTabChange,
  eligibleAgents = [],
  onQuickAssign,
  onSendMessage,
  onAddNote,
  onRefreshSummary,
  refreshingSummary = false,
  unreadIds = [],
  detailBasePath = '/agent/inquiries',
}) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [showContextRail, setShowContextRail] = useState(true);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState([]);
  const messagesEndRef = useRef(null);

  const activeInquiry =
    inquiries.find((i) => i.id === selectedId) || inquiries[0] || null;

  useEffect(() => {
    setHighlightedIds([]);
  }, [activeInquiry?.id]);

  const handleSelect = (inq) => {
    onSelectInquiry?.(inq.id);
    setMobileShowThread(true);
  };

  const handleReplySubmit = async (e) => {
    if (e) e.preventDefault();
    const content = replyText.trim();
    if (!content || !activeInquiry || !onSendMessage || sending) return;
    setSending(true);
    setReplyText('');
    try {
      await onSendMessage(activeInquiry.id, content);
      messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReplySubmit();
    }
  };

  const handleCiteMessage = (ids = []) => {
    setHighlightedIds(ids);
    if (ids.length > 0 && typeof document !== 'undefined') {
      const el = document.getElementById(`msg-${ids[0]}`);
      el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNoteSubmit = async (content) => {
    if (!activeInquiry || !onAddNote) return;
    setAddingNote(true);
    try {
      await onAddNote(activeInquiry.id, content);
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return <TableSkeleton rows={5} cols={4} />;
  }

  return (
    <div
      data-testid="inquiry-messaging-workspace"
      className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_auto] min-h-[620px] lg:h-[calc(100vh-250px)]"
    >
      {/* Left Pane: Searchable Conversation List */}
      <aside
        className={`border-r border-[#E2E8F0] bg-[#F8FAFC] flex flex-col min-h-0 ${
          mobileShowThread ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className="p-3 border-b border-[#E2E8F0] bg-white space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search conversations..."
              aria-label="Search conversations"
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder:text-[#64748B] focus:border-[#0F766E] outline-none"
            />
          </div>

          {tabs.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange?.(tab.key)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:bg-slate-100 border border-[#E2E8F0]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
          {inquiries.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon="inbox"
                title="No conversations"
                description="Try adjusting your search or queue filter."
              />
            </div>
          ) : (
            inquiries.map((inq) => {
              const isSelected = activeInquiry?.id === inq.id;
              const isUnread = unreadIds.includes(inq.id);
              return (
                <button
                  key={inq.id}
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(inq)}
                  className={`w-full text-left p-3.5 transition-colors cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-white border-l-4 border-l-[#0F766E]'
                      : 'hover:bg-white/80 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#1E293B] truncate inline-flex items-center gap-1.5">
                      {isUnread && (
                        <span
                          aria-label="Unread message"
                          className="w-2 h-2 rounded-full bg-[#FF6B6B] shrink-0"
                        />
                      )}
                      <span className="truncate">{inq.client_name}</span>
                    </span>
                    <StatusBadge status={inq.status} />
                  </div>

                  <p className="text-[11px] font-semibold text-[#0F766E] truncate">
                    {inq.property_title || 'General Inquiry'}
                  </p>

                  <p className="text-xs text-[#64748B] line-clamp-1">
                    {inq.last_message || 'No messages yet'}
                  </p>

                  <div className="flex items-center justify-between gap-1.5 pt-0.5 flex-wrap">
                    <InquirySourceBadge
                      source={inq.source}
                      consentAccepted={inq.consentAccepted ?? inq.consent_accepted}
                    />
                    <SlaCountdownPill
                      createdAt={inq.created_at}
                      operationalStatus={inq.operational_status}
                      businessStatus={inq.business_status}
                      firstRespondedAt={inq.first_responded_at}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Center Pane: Live Message Thread & Reply Composer */}
      <section
        className={`flex flex-col min-h-0 bg-white ${
          !mobileShowThread ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {activeInquiry ? (
          <>
            {/* Thread Header */}
            <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between gap-3 flex-wrap bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileShowThread(false)}
                  aria-label="Back to conversations"
                  className="lg:hidden p-1.5 rounded-lg border border-[#E2E8F0] text-[#1E293B]"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-sm text-[#1E293B] truncate">
                      {activeInquiry.client_name}
                    </h2>
                    <SlaCountdownPill
                      createdAt={activeInquiry.created_at}
                      operationalStatus={activeInquiry.operational_status}
                      businessStatus={activeInquiry.business_status}
                      firstRespondedAt={activeInquiry.first_responded_at}
                    />
                  </div>
                  <p className="text-[11px] text-[#64748B] truncate">
                    {activeInquiry.property_title} · {activeInquiry.client_email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {role === 'broker' && eligibleAgents.length > 0 && onQuickAssign && (
                  <select
                    aria-label={`Quick assign consultant for ${activeInquiry.client_name}`}
                    value={activeInquiry.agent_id || ''}
                    onChange={(e) => onQuickAssign(activeInquiry.id, e.target.value)}
                    className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[#1E293B] focus:border-[#0F766E] outline-none cursor-pointer"
                  >
                    <option value="">Assign verified agent...</option>
                    {eligibleAgents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name || a.fullName}
                      </option>
                    ))}
                  </select>
                )}

                <Link
                  to={`${detailBasePath}/${activeInquiry.id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#1E293B] hover:bg-[#F8FAFC]"
                >
                  <span>Full Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowContextRail((v) => !v)}
                  aria-label="Toggle context panel"
                  className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                >
                  {showContextRail ? (
                    <PanelRightClose className="w-4 h-4" />
                  ) : (
                    <PanelRightOpen className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
              {(activeInquiry.messages || []).length > 0 ? (
                activeInquiry.messages.map((msg) => {
                  const isStaff = msg.sender === 'agent' || msg.sender === 'broker';
                  const isHighlighted = highlightedIds.includes(msg.id);
                  return (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[10px] text-[#64748B]">
                        <span className="font-bold">{msg.sender_name || (isStaff ? 'Agent' : activeInquiry.client_name)}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed transition-shadow ${
                          isStaff
                            ? 'bg-[#0F766E] text-white rounded-br-xs'
                            : 'bg-white text-[#1E293B] border border-[#E2E8F0] rounded-bl-xs'
                        } ${isHighlighted ? 'ring-2 ring-[#FF6B6B] ring-offset-2' : ''}`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-[#64748B] py-12">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs">No messages in this thread yet.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Composer */}
            {onSendMessage && (
              <form
                onSubmit={handleReplySubmit}
                className="p-3 border-t border-[#E2E8F0] bg-white flex items-end gap-2"
              >
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder={`Reply to ${activeInquiry.client_name} (Enter to send)...`}
                  className="flex-1 px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#1E293B] placeholder:text-[#64748B] focus:border-[#0F766E] outline-none resize-none"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  aria-label="Send reply"
                  className="h-10 px-4 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'Sending' : 'Send'}</span>
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-xs text-[#64748B]">
            Select a conversation to view messages.
          </div>
        )}
      </section>

      {/* Right Pane: Collapsible Context & Intelligence Rail */}
      {activeInquiry && showContextRail && (
        <aside className="hidden xl:flex w-[340px] border-l border-[#E2E8F0] bg-[#F8FAFC] flex-col overflow-y-auto p-3.5 space-y-3.5">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              <Building2 className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Client &amp; Property Context</span>
            </div>
            <p className="font-bold text-[#1E293B]">{activeInquiry.client_name}</p>
            <p className="text-[#64748B]">{activeInquiry.client_email}</p>
            {activeInquiry.client_phone && (
              <p className="text-[#64748B]">{activeInquiry.client_phone}</p>
            )}
            <div className="pt-2 border-t border-[#E2E8F0]">
              <p className="font-semibold text-[#0F766E]">{activeInquiry.property_title}</p>
              {activeInquiry.property_price && (
                <p className="text-[11px] font-mono text-[#64748B]">
                  {activeInquiry.property_price}
                </p>
              )}
            </div>
          </div>

          <AiQualificationPanel
            aiSummary={activeInquiry.latest_ai_summary}
            fallbackSummaryText={activeInquiry.ai_summary}
            onCiteMessage={handleCiteMessage}
            onRefresh={
              onRefreshSummary ? () => onRefreshSummary(activeInquiry.id) : undefined
            }
            refreshing={refreshingSummary}
          />

          <InternalNotesRail
            notes={activeInquiry.internal_notes || []}
            onAddNote={onAddNote ? handleNoteSubmit : undefined}
            addingNote={addingNote}
          />
        </aside>
      )}
    </div>
  );
}
