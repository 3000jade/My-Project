import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/dashboard/PageHeader';
import InquiryMessagingWorkspace from '../../components/inquiries/InquiryMessagingWorkspace';
import { inquiryService } from '../../services/inquiryService';
import { agentService } from '../../services/agentService';
import { useAuth } from '../../context/AuthContext';

const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
const API_BASE_URL = RAW_API_BASE.endsWith('/api') ? RAW_API_BASE : `${RAW_API_BASE}/api`;

export default function InquiryMessagesPage({ role = 'agent' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isBroker = role === 'broker';
  const basePath = isBroker ? '/broker/inquiries' : '/agent/inquiries';
  const messagesPath = `${basePath}/messages`;

  const [inquiries, setInquiries] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshingSummary, setRefreshingSummary] = useState(false);
  const [unreadIds, setUnreadIds] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedId, setSelectedId] = useState(id || null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    if (id) setSelectedId(id);
  }, [id]);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [list, agentList] = await Promise.all([
        isBroker
          ? inquiryService.getInquiries()
          : inquiryService.getInquiries({ agentId: user?.id || 'agent-1' }),
        isBroker ? agentService.getAgents().catch(() => []) : Promise.resolve([]),
      ]);
      const nextList = Array.isArray(list) ? list : [];
      setInquiries((prev) => {
        if (silent && prev.length > 0) {
          const prevMap = new Map(prev.map((i) => [i.id, i]));
          const newlyUpdated = nextList
            .filter((nextItem) => {
              if (nextItem.id === selectedIdRef.current) return false;
              const old = prevMap.get(nextItem.id);
              return old && (nextItem.messages?.length || 0) > (old.messages?.length || 0);
            })
            .map((i) => i.id);
          if (newlyUpdated.length > 0) {
            setUnreadIds((u) => Array.from(new Set([...u, ...newlyUpdated])));
          }
        }
        return nextList;
      });
      setAgents(Array.isArray(agentList) ? agentList : []);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isBroker, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Rung 2: Hydrate active thread details (messages, AI summary, internal notes) on selection
  useEffect(() => {
    const targetId = selectedId || inquiries[0]?.id;
    if (!targetId) return;
    let cancelled = false;
    inquiryService.getInquiryById(targetId).then((detail) => {
      if (cancelled || !detail) return;
      setInquiries((prev) => prev.map((inq) => (inq.id === detail.id ? { ...inq, ...detail } : inq)));
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Rung 3: Role-scoped SSE stream with Rung 2 visibility-aware 15s polling fallback
  useEffect(() => {
    let pollTimer = null;
    let streamActive = false;
    const controller = new AbortController();

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        if (typeof document === 'undefined' || document.visibilityState === 'visible') {
          loadData({ silent: true });
        }
      }, 15000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !streamActive) {
        loadData({ silent: true });
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('cp_auth_token') : null;
    if (token && typeof fetch === 'function') {
      fetch(`${API_BASE_URL}/inquiries/stream`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok || !res.body) throw new Error('Stream unavailable');
          streamActive = true;
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let currentEvent = 'message';
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const rawLine of lines) {
              const line = rawLine.trimEnd();
              if (line.startsWith('event:')) {
                currentEvent = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                try {
                  const payload = JSON.parse(line.slice(5).trim());
                  if (currentEvent === 'inquiry:message' && payload?.inquiryId && payload?.message) {
                    setInquiries((prev) =>
                      prev.map((inq) => {
                        if (inq.id !== payload.inquiryId) return inq;
                        const exists = (inq.messages || []).some((m) => m.id === payload.message.id);
                        if (exists) return inq;
                        return {
                          ...inq,
                          last_message: payload.message.content || inq.last_message,
                          operational_status: payload.operationalStatus || inq.operational_status,
                          messages: [...(inq.messages || []), payload.message],
                        };
                      })
                    );
                    if (payload.inquiryId !== selectedIdRef.current) {
                      setUnreadIds((u) => Array.from(new Set([...u, payload.inquiryId])));
                    }
                  } else if (currentEvent === 'inquiry:assigned' && payload?.inquiryId) {
                    loadData({ silent: true });
                  }
                } catch {
                  // Ignore malformed SSE frame
                }
              }
            }
          }
          streamActive = false;
          if (!controller.signal.aborted) startPolling();
        })
        .catch(() => {
          streamActive = false;
          if (!controller.signal.aborted) startPolling();
        });
    } else {
      startPolling();
    }

    return () => {
      controller.abort();
      if (pollTimer) clearInterval(pollTimer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [loadData]);

  // Rung 3: Unread count in document title
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const baseTitle = 'Inquiry Messages — Human Shelter Realty';
    document.title = unreadIds.length > 0 ? `(${unreadIds.length}) ${baseTitle}` : baseTitle;
    return () => {
      document.title = 'Human Shelter Realty';
    };
  }, [unreadIds.length]);

  const eligibleAgents = agents.filter(
    (a) => a.verification_status !== 'REJECTED' && a.verification_status !== 'PENDING'
  );

  const handleSelectInquiry = (nextId) => {
    setSelectedId(nextId);
    setUnreadIds((prev) => prev.filter((itemId) => itemId !== nextId));
    navigate(`${messagesPath}/${nextId}`, { replace: true });
  };

  const handleRefreshSummary = async (inquiryId) => {
    setRefreshingSummary(true);
    try {
      const summary = await inquiryService.generateAiSummary(inquiryId);
      if (summary) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === inquiryId ? { ...inq, latest_ai_summary: summary } : inq))
        );
      }
    } finally {
      setRefreshingSummary(false);
    }
  };

  const handleSendMessage = async (inquiryId, content) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const sent = await inquiryService.addMessage(inquiryId, content, requestId).catch(() => ({
      id: `msg-${Date.now()}`,
      sender: role,
      sender_name: user?.fullName || (isBroker ? 'Broker' : 'Agent'),
      timestamp: 'Just now',
      content,
    }));
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId
          ? { ...inq, last_message: content, messages: [...(inq.messages || []), sent] }
          : inq
      )
    );
  };

  const handleAddNote = async (inquiryId, content) => {
    const added = await inquiryService.addNote(inquiryId, content).catch(() => ({
      id: `note-${Date.now()}`,
      authorName: user?.fullName || (isBroker ? 'Broker' : 'Agent'),
      content,
      timestamp: new Date().toISOString(),
    }));
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId
          ? { ...inq, internal_notes: [...(inq.internal_notes || []), added] }
          : inq
      )
    );
  };

  const handleQuickAssign = async (inquiryId, agentId) => {
    if (!agentId || !isBroker) return;
    const selected = eligibleAgents.find((a) => a.id === agentId);
    await inquiryService.assignAgent(inquiryId, agentId, 'Quick-assigned by Broker');
    setInquiries((prev) =>
      prev.map((item) =>
        item.id === inquiryId
          ? { ...item, agent_id: agentId, agent_name: selected?.name || selected?.fullName || item.agent_name }
          : item
      )
    );
  };

  const filtered = inquiries.filter((inq) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (inq.client_name || '').toLowerCase().includes(q) ||
      (inq.property_title || '').toLowerCase().includes(q) ||
      (inq.last_message || '').toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (activeTab === 'AWAITING_AGENT') {
      return inq.operational_status === 'awaiting_agent' || (inq.status || '').toUpperCase() === 'NEW';
    }
    if (activeTab === 'UNASSIGNED') {
      return isBroker && (inq.operational_status === 'unassigned' || !inq.agent_id);
    }
    if (activeTab === 'OVERDUE') {
      return inq.operational_status === 'overdue';
    }
    if (activeTab === 'AI_CHATBOT') {
      return inq.source === 'ai_chatbot';
    }
    return true;
  });

  const tabs = isBroker
    ? [
        { key: 'ALL', label: `All (${inquiries.length})` },
        { key: 'UNASSIGNED', label: `Unassigned (${inquiries.filter((i) => i.operational_status === 'unassigned' || !i.agent_id).length})` },
        { key: 'OVERDUE', label: `Overdue (${inquiries.filter((i) => i.operational_status === 'overdue').length})` },
        { key: 'AI_CHATBOT', label: `AI Chatbot (${inquiries.filter((i) => i.source === 'ai_chatbot').length})` },
      ]
    : [
        { key: 'ALL', label: `All (${inquiries.length})` },
        { key: 'AWAITING_AGENT', label: `Unanswered (${inquiries.filter((i) => i.operational_status === 'awaiting_agent' || (i.status || '').toUpperCase() === 'NEW').length})` },
        { key: 'OVERDUE', label: `Overdue (${inquiries.filter((i) => i.operational_status === 'overdue').length})` },
        { key: 'AI_CHATBOT', label: `AI Chatbot (${inquiries.filter((i) => i.source === 'ai_chatbot').length})` },
      ];

  return (
    <div className="space-y-4 max-w-[1440px] mx-auto">
      <PageHeader
        title="Inquiry Messages"
        subtitle="Dedicated split-view messaging workspace for live client and AI Concierge conversations."
        breadcrumbs={[
          { label: 'Dashboard', to: isBroker ? '/broker/dashboard' : '/agent/dashboard' },
          { label: 'Inquiry Dashboard', to: basePath },
          { label: 'Messages' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={basePath}
              className="h-[42px] px-4 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Inquiry Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="h-[42px] px-4 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      <InquiryMessagingWorkspace
        role={role}
        inquiries={filtered}
        selectedId={selectedId}
        onSelectInquiry={handleSelectInquiry}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        eligibleAgents={eligibleAgents}
        onQuickAssign={isBroker ? handleQuickAssign : undefined}
        onSendMessage={handleSendMessage}
        onAddNote={handleAddNote}
        onRefreshSummary={handleRefreshSummary}
        refreshingSummary={refreshingSummary}
        unreadIds={unreadIds}
        detailBasePath={basePath}
      />
    </div>
  );
}
