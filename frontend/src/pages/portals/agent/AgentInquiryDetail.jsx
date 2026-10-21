import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import { inquiryService } from '../../../services/inquiryService';

export default function AgentInquiryDetail() {
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('2026-09-28');
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [appointmentType, setAppointmentType] = useState('Site Visit');
  const [appointmentConfirmedMessage, setAppointmentConfirmedMessage] = useState(false);

  // Communication & AI Enhancements (UX-01)
  const [timeline, setTimeline] = useState([]);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetBusinessStatus, setTargetBusinessStatus] = useState('inactive');
  const [inactivateOutcome, setInactivateOutcome] = useState('lost');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Follow-up Task creation
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const data = await inquiryService.getInquiryById(id);
        if (mounted) {
          if (data) {
            setInquiry(data);
            try {
              const tl = await inquiryService.getTimeline(id);
              if (mounted) setTimeline(tl || []);
            } catch {
              // ignore timeline fetch errors
            }
          } else {
            setError(`Inquiry "${id}" was not found.`);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to retrieve inquiry details.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [id]);

  const [internalNotes, setInternalNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (inquiry?.internal_notes) {
      setInternalNotes(inquiry.internal_notes);
    }
  }, [inquiry]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !inquiry) return;

    const content = replyText.trim();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setReplyText('');
    setSendingReply(true);

    try {
      const sentMessage = await inquiryService.addMessage(inquiry.id, content, requestId);
      setInquiry((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), sentMessage],
        last_message: content,
        status: prev.status === 'NEW' ? 'ASSIGNED' : prev.status,
        latest_ai_summary: prev.latest_ai_summary
          ? { ...prev.latest_ai_summary, generationStatus: 'outdated' }
          : null,
      }));
    } catch (err) {
      console.warn('Error syncing message via API, updating locally:', err.message);
      const fallbackMsg = {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        sender_name: inquiry.agent_name || 'Elena Rossi',
        timestamp: 'Just now',
        content,
        delivery_status: 'saved',
      };
      setInquiry((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), fallbackMsg],
        last_message: content,
        latest_ai_summary: prev.latest_ai_summary
          ? { ...prev.latest_ai_summary, generationStatus: 'outdated' }
          : null,
      }));
    } finally {
      setSendingReply(false);
    }
  };

  const handleAddInternalNote = async (e) => {
    if (e) e.preventDefault();
    if (!newNoteText.trim() || !inquiry) return;

    const content = newNoteText.trim();
    setNewNoteText('');
    setAddingNote(true);

    try {
      const added = await inquiryService.addNote(inquiry.id, content);
      setInternalNotes((prev) => [...prev, added]);
    } catch (err) {
      console.warn('Error adding note via API, saving locally:', err.message);
      const fallbackNote = {
        id: `note-${Date.now()}`,
        authorName: inquiry.agent_name || 'Elena Rossi',
        authorRole: 'agent',
        content,
        timestamp: new Date().toISOString(),
      };
      setInternalNotes((prev) => [...prev, fallbackNote]);
    } finally {
      setAddingNote(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !inquiry) return;
    setCreatingTask(true);
    try {
      const task = await inquiryService.createFollowUpTask(inquiry.id, {
        title: newTaskTitle.trim(),
        dueAt: newTaskDue || new Date(Date.now() + 86400_000).toISOString(),
      });
      setInquiry((prev) => ({
        ...prev,
        follow_up_tasks: [...(prev.follow_up_tasks || []), task],
      }));
      setNewTaskTitle('');
      setNewTaskDue('');
    } catch (err) {
      console.warn('Failed creating task:', err.message);
      const fallbackTask = {
        id: `task-${Date.now()}`,
        title: newTaskTitle.trim(),
        dueAt: newTaskDue || new Date(Date.now() + 86400_000).toISOString(),
        status: 'pending',
      };
      setInquiry((prev) => ({
        ...prev,
        follow_up_tasks: [...(prev.follow_up_tasks || []), fallbackTask],
      }));
      setNewTaskTitle('');
      setNewTaskDue('');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await inquiryService.updateFollowUpTask(inquiry.id, task.id, { status: nextStatus });
    } catch {
      // ignore API failure in mock
    }
    setInquiry((prev) => ({
      ...prev,
      follow_up_tasks: (prev.follow_up_tasks || []).map((t) =>
        t.id === task.id ? { ...t, status: nextStatus } : t
      ),
    }));
  };

  const handleGenerateSummary = async () => {
    if (!inquiry) return;
    setGeneratingSummary(true);
    try {
      const result = await inquiryService.generateAiSummary(inquiry.id);
      setInquiry((prev) => ({
        ...prev,
        latest_ai_summary: result,
      }));
    } catch (err) {
      console.warn('Generate summary error:', err.message);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleSaveBusinessStatus = async () => {
    if (!inquiry || !statusReason.trim()) return;
    setUpdatingStatus(true);
    try {
      const payload = {
        businessStatus: targetBusinessStatus,
        reason: statusReason.trim(),
        ...(targetBusinessStatus === 'inactive' ? { outcome: inactivateOutcome } : {}),
      };
      const updated = await inquiryService.changeBusinessStatus(inquiry.id, payload);
      setInquiry(updated);
      setShowStatusModal(false);
      setStatusReason('');
    } catch (err) {
      console.warn('Update business status error:', err.message);
      setInquiry((prev) => ({
        ...prev,
        business_status: targetBusinessStatus,
      }));
      setShowStatusModal(false);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateAppointment = async () => {
    setAppointmentConfirmedMessage(true);
    if (inquiry) {
      try {
        await inquiryService.scheduleViewing(
          inquiry.id,
          `${appointmentDate} ${appointmentTime}`,
          appointmentType
        );
      } catch (err) {
        console.warn('API appointment scheduling failed, applying locally:', err.message);
      }

      const scheduleMsg = {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        sender_name: inquiry.agent_name || 'Elena Rossi',
        timestamp: 'Just now',
        content: `Appointment scheduled: ${appointmentType} on ${appointmentDate} at ${appointmentTime}.`,
      };
      setInquiry((prev) => ({
        ...prev,
        status: 'SCHEDULED',
        messages: [...(prev.messages || []), scheduleMsg],
        last_message: scheduleMsg.content,
      }));
    }

    setTimeout(() => {
      setAppointmentConfirmedMessage(false);
      setShowAppointmentModal(false);
    }, 1800);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-16 text-center space-y-3 max-w-6xl mx-auto">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[#0F766E] border-t-transparent"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] font-sans">
          Loading assigned inquiry dossier...
        </p>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeader
          title="Inquiry Not Found"
          breadcrumbs={[
            { label: "Dashboard", to: "/agent/dashboard" },
            { label: "Inquiries", to: "/agent/inquiries" },
            { label: "Error" }
          ]}
        />
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-lg text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-rose-600">error</span>
          <h2 className="text-lg font-bold text-[#1E293B]">Inquiry Record Unavailable</h2>
          <p className="text-sm text-[#64748B] font-sans max-w-md mx-auto">
            {error || "The inquiry record could not be located."}
          </p>
          <Link
            to="/agent/inquiries"
            className="inline-block px-5 py-2 bg-[#0F766E] text-white rounded-lg text-xs font-bold uppercase tracking-wider font-sans hover:bg-[#115E59] transition-colors"
          >
            ← Return to Inquiries List
          </Link>
        </div>
      </div>
    );
  }

  const aiSummary = inquiry.latest_ai_summary;
  const isInactive = inquiry.business_status === 'inactive';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader
        title={`Inquiry from ${inquiry.client_name}`}
        subtitle={`Reference: ${inquiry.reference_code || inquiry.id} • Registered ${inquiry.created_at}`}
        breadcrumbs={[
          { label: "Dashboard", to: "/agent/dashboard" },
          { label: "Inquiries", to: "/agent/inquiries" },
          { label: inquiry.client_name }
        ]}
        badge={
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-bold uppercase rounded tracking-wider ${
                isInactive ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isInactive ? 'Inactive Lead' : 'Active Lead'}
            </span>
            <StatusBadge status={inquiry.status} />
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTargetBusinessStatus(isInactive ? 'active' : 'inactive');
                setShowStatusModal(true);
              }}
              className="h-[42px] px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E8F0] rounded-lg text-xs font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer"
            >
              {isInactive ? 'Reactivate Inquiry' : 'Mark Inactive'}
            </button>
            <button
              onClick={() => setShowAppointmentModal(true)}
              className="h-[42px] px-4 bg-[#FF6B6B] hover:bg-[#fa5252] text-white rounded-lg text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              Schedule Viewing
            </button>
          </div>
        }
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 6-Section AI Client Summary Report & Messages */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Client Summary Report Card (UX-01, AI-01, AI-02) */}
          <div
            data-testid="ai-client-summary-card"
            className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E] text-2xl">psychology</span>
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B]">AI Client Summary Report</h3>
                  <p className="text-[11px] text-[#64748B]">
                    Structured lead qualification synthesized from conversation history
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {aiSummary && (
                  <span
                    data-testid="ai-summary-status-badge"
                    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      aiSummary.generationStatus === 'outdated'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : aiSummary.generationStatus === 'ready'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {aiSummary.generationStatus}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="px-3 py-1 bg-[#0F766E] hover:bg-[#115E59] text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {generatingSummary ? 'Regenerating...' : 'Refresh AI Summary'}
                </button>
              </div>
            </div>

            {aiSummary?.sections ? (
              <div className="space-y-4 text-xs">
                {/* Section 1: Client Overview */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-[#0F766E] uppercase tracking-wider text-[10px] block mb-1">
                    1. Client Overview
                  </span>
                  <p className="text-[#1E293B] font-medium leading-relaxed">
                    {aiSummary.sections.clientOverview?.summary}
                  </p>
                </div>

                {/* Section 2: Property Requirements */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-[#0F766E] uppercase tracking-wider text-[10px] block mb-2">
                    2. Property Requirements & Criteria
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#64748B]">Target Property:</span>{' '}
                      <strong className="text-[#1E293B]">
                        {aiSummary.sections.propertyRequirements?.targetProperty?.value}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Budget:</span>{' '}
                      <strong className="text-[#1E293B]">
                        {aiSummary.sections.propertyRequirements?.budget?.value}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Bedrooms:</span>{' '}
                      <span className="text-[#1E293B]">
                        {aiSummary.sections.propertyRequirements?.bedrooms?.value}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Bathrooms:</span>{' '}
                      <span className="text-[#64748B] italic">
                        {aiSummary.sections.propertyRequirements?.bathrooms?.value}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[#64748B]">Features / Must-Haves:</span>{' '}
                      <span className="text-[#1E293B]">
                        {aiSummary.sections.propertyRequirements?.mustHaveFeatures?.value}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3 & 4: Timeline & Readiness */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-[#0F766E] uppercase tracking-wider text-[10px] block mb-1">
                      3. Timeline & Urgency
                    </span>
                    <p className="text-[11px]">
                      <span className="text-[#64748B]">Timeframe:</span>{' '}
                      <strong>{aiSummary.sections.timelineAndUrgency?.timeframe?.value}</strong>
                    </p>
                    <p className="text-[11px] mt-1">
                      <span className="text-[#64748B]">Urgency Level:</span>{' '}
                      <span className="uppercase font-bold text-amber-700">
                        {aiSummary.sections.timelineAndUrgency?.urgencyLevel}
                      </span>
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-[#0F766E] uppercase tracking-wider text-[10px] block mb-1">
                      4. Readiness & Mode
                    </span>
                    <p className="text-[11px]">
                      <span className="text-[#64748B]">Financing:</span>{' '}
                      <strong>{aiSummary.sections.qualificationAndReadiness?.financingMode?.value}</strong>
                    </p>
                    <p className="text-[11px] mt-1">
                      <span className="text-[#64748B]">Decision Makers:</span>{' '}
                      <span>{aiSummary.sections.qualificationAndReadiness?.decisionMakers?.value}</span>
                    </p>
                  </div>
                </div>

                {/* Section 5: Key Questions */}
                {aiSummary.sections.keyQuestionsAndConcerns?.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-[#0F766E] uppercase tracking-wider text-[10px] block mb-1">
                      5. Key Questions & Client Inquiries
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      {aiSummary.sections.keyQuestionsAndConcerns.map((q, idx) => (
                        <li key={idx} className="text-[#1E293B]">
                          {q.question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Section 6: Recommended Next Action */}
                <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200 flex items-start justify-between">
                  <div>
                    <span className="font-bold text-[#0F766E] uppercase tracking-wider text-[10px] block mb-0.5">
                      6. Recommended Next Action
                    </span>
                    <p className="text-xs font-bold text-[#0F766E]">
                      {aiSummary.sections.recommendedNextAction?.action}
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {aiSummary.sections.recommendedNextAction?.rationale}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-[#0F766E] text-white rounded text-[10px] font-bold uppercase tracking-wider">
                    {aiSummary.sections.recommendedNextAction?.priority}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#64748B] italic">
                {inquiry.ai_summary || 'No AI summary generated yet. Click "Refresh AI Summary" to generate report.'}
              </p>
            )}
          </div>

          {/* Follow-up Tasks Panel (TASK-01) */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E] text-lg">checklist</span>
                Follow-up Tasks
              </h3>
              <span className="text-xs text-[#64748B] font-mono">
                {inquiry.follow_up_tasks?.length || 0} active
              </span>
            </div>

            <div className="space-y-2">
              {inquiry.follow_up_tasks && inquiry.follow_up_tasks.length > 0 ? (
                inquiry.follow_up_tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => handleToggleTaskStatus(task)}
                        className="rounded accent-[#0F766E] cursor-pointer"
                      />
                      <span className={task.status === 'completed' ? 'line-through text-slate-400' : 'font-medium text-slate-800'}>
                        {task.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B]">
                      Due: {task.dueAt ? task.dueAt.substring(0, 10) : 'Soon'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#64748B] italic py-2">No follow-up tasks scheduled.</p>
              )}
            </div>

            <form onSubmit={handleCreateTask} className="pt-2 flex gap-2">
              <input
                type="text"
                placeholder="New follow-up task (e.g., Send deeded parking schematic)..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 h-[38px] px-3 border border-[#E2E8F0] rounded text-xs outline-none focus:border-[#0F766E]"
              />
              <button
                type="submit"
                disabled={creatingTask || !newTaskTitle.trim()}
                className="px-4 h-[38px] bg-[#0F766E] hover:bg-[#115E59] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
              >
                Add Task
              </button>
            </form>
          </div>

          {/* Conversation History */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs flex flex-col h-[520px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] font-sans pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#0F766E]">forum</span>
                <span>Conversation History</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                ● Live sync active
              </span>
            </h3>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar" data-lenis-prevent="true">
              {inquiry.messages && inquiry.messages.length > 0 ? (
                inquiry.messages.map((msg) => {
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
                        {isAgent && (
                          <span className="text-[10px] font-mono text-[#0F766E]">
                            {msg.delivery_status === 'read' ? '✓✓ Read' : '✓ Sent'}
                          </span>
                        )}
                      </div>
                      <div
                        className={`max-w-md p-3.5 rounded-lg text-xs leading-relaxed ${
                          isAgent
                            ? 'bg-[#0F766E] text-white'
                            : 'bg-[#F1F5F9] text-slate-800'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-xs text-gray-400 font-sans">
                  No conversation messages registered yet.
                </div>
              )}
            </div>

            {/* Reply Input Bar */}
            <form onSubmit={handleSendReply} className="pt-4 border-t border-[#E2E8F0] flex gap-3 items-center">
              <input
                type="text"
                placeholder="Type your message to the client..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 h-[46px] px-4 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs font-sans focus:border-[#0F766E] focus:bg-white outline-none"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="h-[46px] px-5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{sendingReply ? 'Sending...' : 'Send'}</span>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Client & Property Metadata & Timeline */}
        <div className="space-y-6">
          {/* Client Details */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] font-sans">
              Client Details
            </h3>
            <div className="space-y-3 font-sans text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center font-bold font-display">
                  {inquiry.client_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-[#1E293B] text-sm">{inquiry.client_name}</p>
                  <p className="text-[11px] text-[#64748B]">Prospective Buyer</p>
                </div>
              </div>
              <div className="pt-3 border-t border-[#E2E8F0] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Email:</span>
                  <span className="font-medium text-[#1E293B]">{inquiry.client_email}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Phone:</span>
                  <span className="font-medium text-[#1E293B]">{inquiry.client_phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Property Reference */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] font-sans">
              Property Referenced
            </h3>
            <div className="space-y-1">
              <p className="font-bold text-[#1E293B] text-sm">
                {inquiry.property_title}
              </p>
              <p className="text-sm font-bold font-display text-[#0F766E]">
                {inquiry.property_price}
              </p>
              <Link
                to={`/agent/properties/${inquiry.property_id}`}
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#0F766E] hover:text-[#115E59] pt-2 font-sans"
              >
                <span>View Listing Page</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Activity Timeline (AUD-01) */}
          <div
            data-testid="inquiry-activity-timeline"
            className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] font-sans flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#0F766E] text-base">history</span>
              Activity Timeline
            </h3>

            <div className="space-y-3 max-h-56 overflow-y-auto" data-lenis-prevent="true">
              {timeline && timeline.length > 0 ? (
                timeline.map((evt) => (
                  <div key={evt.id} className="text-xs border-l-2 border-[#0F766E] pl-2.5 py-0.5 space-y-0.5">
                    <p className="font-bold text-[#1E293B] text-[11px]">{evt.title}</p>
                    <p className="text-[#64748B] text-[10px] leading-tight">{evt.description}</p>
                    <span className="text-[9px] font-mono text-slate-400 block">
                      {evt.timestamp ? evt.timestamp.substring(0, 16).replace('T', ' ') : 'Recent'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#64748B] italic py-1">No recorded timeline events.</p>
              )}
            </div>
          </div>

          {/* Private Agent Dossier Notes */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] font-sans flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-600">lock</span>
                Private Internal Notes
              </h3>
              <span className="text-[10px] font-mono uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">
                Staff Only
              </span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto" data-lenis-prevent="true">
              {internalNotes && internalNotes.length > 0 ? (
                internalNotes.map((n, i) => (
                  <div key={n.id || i} className="p-2.5 bg-amber-50/60 rounded border border-amber-200/60 text-xs space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-amber-800">
                      <strong>{n.authorName || n.author_name || 'Agent'}</strong>
                      <span>{n.timestamp ? n.timestamp.substring(0, 10) : 'Recent'}</span>
                    </div>
                    <p className="text-gray-700 font-sans">{n.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic text-center py-2">No internal notes recorded yet.</p>
              )}
            </div>

            <form onSubmit={handleAddInternalNote} className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Add confidential client note..."
                rows={2}
                className="w-full p-2.5 border border-[#E2E8F0] rounded text-xs font-sans outline-none focus:border-[#0F766E] resize-none"
              />
              <button
                type="submit"
                disabled={addingNote || !newNoteText.trim()}
                className="w-full py-1.5 bg-[#1E293B] hover:bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider font-sans transition-colors disabled:opacity-50 cursor-pointer"
              >
                {addingNote ? 'Saving...' : 'Save Private Note'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Lifecycle Status Modal (Active/Inactive with Reason & Outcome) */}
      <DashboardModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={targetBusinessStatus === 'inactive' ? 'Mark Inquiry Inactive' : 'Reactivate Inquiry'}
        subtitle="Record reason and audit outcome for client relationship tracking"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 font-sans cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveBusinessStatus}
              disabled={updatingStatus || !statusReason.trim()}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-bold font-sans uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              {updatingStatus ? 'Updating...' : 'Confirm Transition'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-sans">
          {targetBusinessStatus === 'inactive' && (
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-slate-600 block">
                Inactivation Outcome
              </label>
              <select
                value={inactivateOutcome}
                onChange={(e) => setInactivateOutcome(e.target.value)}
                className="w-full h-[40px] px-3 border border-[#E2E8F0] rounded outline-none focus:border-[#0F766E]"
              >
                <option value="purchased">Purchased through firm</option>
                <option value="withdrawn">Client withdrawn / paused search</option>
                <option value="lost">Lost to competitor / alternative property</option>
                <option value="unresponsive">Unresponsive after multiple contacts</option>
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold uppercase tracking-wider text-slate-600 block">
              Transition Reason (Required)
            </label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Explain why this inquiry is transitioning..."
              rows={3}
              className="w-full p-3 border border-[#E2E8F0] rounded outline-none focus:border-[#0F766E] resize-none"
            />
          </div>
        </div>
      </DashboardModal>

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
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 font-sans cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAppointment}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer"
            >
              Confirm Schedule
            </button>
          </div>
        }
      >
        {appointmentConfirmedMessage ? (
          <div className="p-6 text-center space-y-2">
            <span className="material-symbols-outlined text-[48px] text-[#0F766E]">check_circle</span>
            <h4 className="text-base font-bold text-[#1E293B]">Appointment Scheduled</h4>
            <p className="text-xs text-[#64748B] font-sans">
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
                className="w-full h-[46px] px-3 border border-[#E2E8F0] rounded-lg text-xs font-sans outline-none focus:border-[#0F766E] cursor-pointer"
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
                  className="w-full h-[46px] px-3 border border-[#E2E8F0] rounded-lg text-xs font-sans outline-none focus:border-[#0F766E]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Time</label>
                <input
                  type="text"
                  value={appointmentTime}
                  onChange={e => setAppointmentTime(e.target.value)}
                  className="w-full h-[46px] px-3 border border-[#E2E8F0] rounded-lg text-xs font-sans outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>
          </div>
        )}
      </DashboardModal>
    </div>
  );
}
