import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus, Shield, Download } from 'lucide-react';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import InquiryDetailShell from '../../../components/inquiries/InquiryDetailShell';
import InquiryConversationPanel from '../../../components/inquiries/InquiryConversationPanel';
import InquiryAiSummaryCard from '../../../components/inquiries/InquiryAiSummaryCard';
import InquiryFollowUpTasksCard from '../../../components/inquiries/InquiryFollowUpTasksCard';
import InquiryInternalNotesCard from '../../../components/inquiries/InquiryInternalNotesCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  useToast,
} from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Field, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { inquiryService } from '../../../services/inquiryService';
<<<<<<< HEAD
import { Spinner, ViewPropertyButton } from '../../../components/ui';
import { InquiryDetailSkeleton } from '../../../components/dashboard/skeletons';
import InquirySourceBadge from '../../../components/inquiries/InquirySourceBadge';
import SlaCountdownPill from '../../../components/inquiries/SlaCountdownPill';
import AiQualificationPanel from '../../../components/inquiries/AiQualificationPanel';
import InternalNotesRail from '../../../components/inquiries/InternalNotesRail';
=======
>>>>>>> property-tech-v3.0
import { agentService } from '../../../services/agentService';

export default function BrokerInquiryDetail() {
  const { id } = useParams();
  const { toast } = useToast();

  const [inquiry, setInquiry] = useState(null);
  const [allInquiries, setAllInquiries] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [detailTab, setDetailTab] = useState('conversation');
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [reassignReason, setReassignReason] = useState('Reassigned by Broker');
  const [saving, setSaving] = useState(false);

  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const [data, audits, agentList, allList] = await Promise.all([
          inquiryService.getInquiryById(id),
          inquiryService.getAuditEvents?.({ inquiryId: id })?.catch(() => []) || Promise.resolve([]),
          agentService.getAgents?.()?.catch(() => []) || Promise.resolve([]),
          inquiryService.getInquiries?.()?.catch(() => []) || Promise.resolve([]),
        ]);
        if (!mounted) return;
        setAgents(Array.isArray(agentList) ? agentList : []);
        setAllInquiries(Array.isArray(allList) ? allList : []);
        if (data) {
          setInquiry(data);
          setSelectedAgentId(data.agent_id || '');
          setAuditEvents(Array.isArray(audits) ? audits : []);
        } else {
          setError(`Inquiry with ID "${id}" could not be found.`);
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Error loading inquiry details.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSaveReassignment = async () => {
    if (!selectedAgentId || !inquiry) return;
    const selectedAgent = agents.find((a) => a.id === selectedAgentId) || {
      id: selectedAgentId,
      name: 'Assigned Specialist',
    };

    setSaving(true);
    try {
      const updated = await inquiryService.assignAgent(inquiry.id, selectedAgentId, reassignReason);
      setInquiry(updated);
      const refreshedAudits = await inquiryService.getAuditEvents?.({ inquiryId: inquiry.id }).catch(() => []);
      setAuditEvents(Array.isArray(refreshedAudits) ? refreshedAudits : []);
      toast({
        title: 'Specialist Reassigned',
        description: `Inquiry reassigned to ${selectedAgent.name}.`,
        variant: 'success',
      });
    } catch (err) {
      const updated = await inquiryService.updateInquiry(inquiry.id, {
        agent_id: selectedAgent.id,
        agent_name: selectedAgent.name,
        status: 'ASSIGNED',
      });
      setInquiry(updated);
      toast({
        title: 'Reassigned Locally',
        description: `Consultant reassigned to ${selectedAgent.name}.`,
        variant: 'primary',
      });
    } finally {
      setSaving(false);
      setReassignModalOpen(false);
    }
  };

  const handleRefreshSummary = async () => {
    if (!inquiry) return;
    setGeneratingSummary(true);
    try {
      const result = await inquiryService.generateAiSummary(inquiry.id);
      setInquiry((prev) => ({ ...prev, latest_ai_summary: result }));
      toast({ title: 'AI Summary Updated', description: '6-section report refreshed.', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Summary Failed',
        description: err.message || 'Could not refresh AI summary.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleCreateTask = async (title) => {
    if (!title || !inquiry) return;
    setCreatingTask(true);
    const dueAt = new Date(Date.now() + 86400_000).toISOString();
    try {
      const task = await inquiryService.createFollowUpTask(inquiry.id, { title, dueAt });
      setInquiry((prev) => ({
        ...prev,
        follow_up_tasks: [...(prev.follow_up_tasks || []), task],
      }));
      toast({ title: 'Task Added', description: `"${title}" scheduled.`, variant: 'success' });
    } catch {
      const fallbackTask = { id: `task-${Date.now()}`, title, dueAt, status: 'pending' };
      setInquiry((prev) => ({
        ...prev,
        follow_up_tasks: [...(prev.follow_up_tasks || []), fallbackTask],
      }));
      toast({ title: 'Saved Locally', description: 'Task added in current session.', variant: 'warning' });
    } finally {
      setCreatingTask(false);
    }
  };

  const handleToggleTask = async (task) => {
    if (!inquiry) return;
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    setInquiry((prev) => ({
      ...prev,
      follow_up_tasks: (prev.follow_up_tasks || []).map((t) =>
        t.id === task.id ? { ...t, status: nextStatus } : t
      ),
    }));
    try {
      await inquiryService.updateFollowUpTask(inquiry.id, task.id, { status: nextStatus });
    } catch (err) {
      console.warn('Failed updating task status:', err.message);
    }
  };

  const handleAddInternalNote = async (content) => {
    if (!content || !inquiry) return;
    setAddingNote(true);
    try {
      const added = await inquiryService.addNote(inquiry.id, content);
      setInquiry((prev) => ({
        ...prev,
        internal_notes: [...(prev.internal_notes || []), added],
      }));
      toast({ title: 'Note Saved', description: 'Private staff note recorded.', variant: 'success' });
    } catch {
      const fallbackNote = {
        id: `note-${Date.now()}`,
        authorName: 'Supervising Broker',
        authorRole: 'broker',
        content,
        timestamp: new Date().toISOString(),
      };
      setInquiry((prev) => ({
        ...prev,
        internal_notes: [...(prev.internal_notes || []), fallbackNote],
      }));
      toast({ title: 'Saved Locally', description: 'Note stored in current session.', variant: 'warning' });
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <>
      <InquiryDetailShell
        testId="broker-inquiry-detail"
        loading={loading}
        error={error}
        inquiry={inquiry}
        backTo="/broker/inquiries"
        backLabel="Back to Overview"
        breadcrumbs={[
          { label: 'Dashboard', to: '/broker/dashboard' },
          { label: 'Inquiries', to: '/broker/inquiries' },
          { label: inquiry?.client_name || 'Detail' },
        ]}
        title={inquiry ? `Inquiry Dossier: ${inquiry.client_name}` : 'Inquiry Detail'}
        subtitle={
          inquiry
            ? `Ref: ${inquiry.reference_code || inquiry.id} • Consultant: ${inquiry.agent_name || 'Unassigned'}`
            : ''
        }
        badge={
<<<<<<< HEAD
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                inquiry.business_status === 'inactive'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {inquiry.business_status || 'active'}
            </span>
            <StatusBadge status={inquiry.status} />
            <InquirySourceBadge
              source={inquiry.source}
              consentAccepted={inquiry.consentAccepted ?? inquiry.consent_accepted}
            />
            <SlaCountdownPill
              createdAt={inquiry.created_at}
              operationalStatus={inquiry.operational_status}
              businessStatus={inquiry.business_status}
              firstRespondedAt={inquiry.first_responded_at}
            />
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/broker/inquiries"
              className="h-[42px] px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#1E293B] dark:text-slate-100 border border-[#E2E8F0] dark:border-slate-800 rounded-lg text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back
            </Link>
            <button
              onClick={() => setReassignModalOpen(true)}
              aria-label="Reassign Agent"
              className="h-[42px] px-5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Reassign Agent
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[#E2E8F0] dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
            activeTab === 'overview'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-[#64748B] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-[#E2E8F0] dark:border-slate-800'
          }`}
        >
          Inquiry Overview &amp; Thread
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-colors ${
            activeTab === 'audit'
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-[#64748B] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-[#E2E8F0] dark:border-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-sm">shield</span>
          <span>Protected Audit Log ({auditEvents.length})</span>
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: AI Insights & Message Thread */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Assistance Context */}
            {(inquiry.latest_ai_summary || inquiry.ai_summary) && (
              <AiQualificationPanel
                aiSummary={inquiry.latest_ai_summary}
                fallbackSummaryText={inquiry.ai_summary}
              />
            )}

            {/* Messages Feed */}
            <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-6 shadow-xs flex flex-col h-[500px]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-sans pb-3 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#0F766E] dark:text-teal-400">forum</span>
                Communication Audit History
              </h3>

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
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-sans">
                            {msg.sender_name}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">
                            {msg.timestamp}
                          </span>
                        </div>
                        <div
                          className={`max-w-md p-3.5 rounded-lg text-xs leading-relaxed ${
                            isAgent
                              ? 'bg-[#0F766E] text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-xs text-slate-400 font-sans">
                    No previous communication history recorded.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right 1 Col: Assigned Agent & Property Info */}
          <div className="space-y-6">
            {/* Handling Agent */}
            <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-sans">
                Supervising Consultant
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#0F766E]/10 text-[#0F766E] dark:text-teal-400 flex items-center justify-center font-bold">
                  {(inquiry.agent_name || 'U').charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#1E293B] dark:text-slate-100 font-sans">{inquiry.agent_name || 'Unassigned'}</p>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 font-sans">Assigned Consultant</p>
                </div>
              </div>
              <button
                onClick={() => setReassignModalOpen(true)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-[#0F766E] hover:text-white dark:hover:bg-[#0F766E] rounded-lg text-xs font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer text-[#1E293B] dark:text-slate-200"
              >
                Reassign to Different Agent
              </button>
            </Card>

            {/* Client Details */}
            <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-5 shadow-xs space-y-2 text-xs font-sans">
              <h3 className="font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 text-[10px]">
                Client Dossier
              </h3>
              <p className="font-bold text-sm text-[#1E293B] dark:text-slate-100">{inquiry.client_name}</p>
              <p className="text-slate-600 dark:text-slate-400">Email: {inquiry.client_email}</p>
              <p className="text-slate-600 dark:text-slate-400">Phone: {inquiry.client_phone}</p>
            </Card>

            {/* Property Reference */}
            <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-5 shadow-xs space-y-2">
              <h3 className="font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 text-[10px] font-sans">
                Property Referenced
              </h3>
              <p className="font-bold text-sm text-[#1E293B] dark:text-slate-100 font-sans">{inquiry.property_title}</p>
              <p className="text-base font-bold font-display text-[#0F766E] dark:text-teal-400">{inquiry.property_price}</p>
                            <div className="pt-2">
                <ViewPropertyButton
                  to={`/broker/properties/${inquiry.property_id}/edit`}
                  size="sm"
                  label="Edit property"
                  title="Edit Property in Studio"
                />
              </div>
            </Card>

            {/* Private Internal Staff Notes */}
            <InternalNotesRail notes={inquiry.internal_notes || []} />
          </div>
        </div>
      ) : (
        /* Protected Broker Audit Viewer (AUD-02, UX-01) */
        <Card data-testid="broker-protected-audit-viewer" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F766E] dark:text-teal-400">security</span>
                Protected Broker Audit Evidence
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Immutable, append-only security and operational audit trail with field redaction
              </p>
=======
          inquiry && (
            <div className="flex items-center gap-2">
              <Badge variant={inquiry.business_status === 'inactive' ? 'secondary' : 'success'}>
                {inquiry.business_status || 'active'}
              </Badge>
              <StatusBadge status={inquiry.status} />
>>>>>>> property-tech-v3.0
            </div>
          )
        }
        allItems={allInquiries}
        headerActions={
          <Button
            type="button"
            onClick={() => setReassignModalOpen(true)}
            aria-label="Reassign Agent"
            className="h-11 px-4"
          >
            <UserPlus data-icon="inline-start" />
            <span>Reassign Agent</span>
          </Button>
        }
      >
        {inquiry && (
          <Tabs value={detailTab} onValueChange={setDetailTab} className="w-full flex flex-col gap-6">
            <TabsList className="bg-surface border border-outline p-1 h-auto flex-wrap w-fit">
              <TabsTrigger value="conversation" className="min-h-10 text-xs font-semibold px-4 py-2">
                Conversation
              </TabsTrigger>
              <TabsTrigger value="ai_tasks" className="min-h-10 text-xs font-semibold px-4 py-2">
                AI Summary &amp; Tasks
              </TabsTrigger>
              <TabsTrigger value="notes" className="min-h-10 text-xs font-semibold px-4 py-2">
                Private Notes ({(inquiry.internal_notes || []).length})
              </TabsTrigger>
              <TabsTrigger value="audit" className="min-h-10 text-xs font-semibold px-4 py-2 gap-1.5">
                <Shield className="size-3.5" />
                <span>Protected Audit Log ({auditEvents.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="mt-0">
              <InquiryConversationPanel
                inquiry={inquiry}
                viewerRole="broker"
                propertyLinkTo={`/broker/properties/${inquiry.property_id}/edit`}
                propertyLinkLabel="Edit property"
                readOnlyNotice="Supervising view: use Reassign Agent above to assign or transfer consultant ownership."
              />
            </TabsContent>

            <TabsContent value="ai_tasks" className="mt-0 flex flex-col gap-6">
              <InquiryAiSummaryCard
                aiSummary={inquiry.latest_ai_summary}
                fallbackSummary={inquiry.ai_summary}
                generating={generatingSummary}
                onRefresh={handleRefreshSummary}
              />
              <InquiryFollowUpTasksCard
                tasks={inquiry.follow_up_tasks || []}
                onToggleTask={handleToggleTask}
                onCreateTask={handleCreateTask}
                creating={creatingTask}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-0">
              <InquiryInternalNotesCard
                notes={inquiry.internal_notes || []}
                onAddNote={handleAddInternalNote}
                adding={addingNote}
              />
            </TabsContent>

            <TabsContent value="audit" className="mt-0">
              <Card data-testid="broker-protected-audit-viewer" className="bg-surface border border-outline shadow-xs">
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-outline pb-4">
                  <div>
                    <CardTitle className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <Shield className="size-4 text-primary" />
                      <span>Protected Broker Audit Evidence</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-on-surface-variant">
                      Immutable, append-only security and operational audit trail with field redaction
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(auditEvents, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `audit-export-${inquiry.id}.json`;
                      a.click();
                    }}
                    className="min-h-11 sm:min-h-9"
                  >
                    <Download data-icon="inline-start" />
                    <span>Export Audit JSON</span>
                  </Button>
                </CardHeader>

                <CardContent className="pt-4 flex flex-col gap-3">
                  {auditEvents.length > 0 ? (
                    auditEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3 bg-surface-variant/60 rounded-lg border border-outline text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-primary">{evt.eventType}</span>
                          <span className="text-[11px] text-on-surface-variant tabular-nums">{evt.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <span>
                            Actor: <strong className="text-on-surface">{evt.actorName}</strong> ({evt.actorRole || 'system'})
                          </span>
                          <span>•</span>
                          <span>
                            Outcome:{' '}
                            <strong className={evt.outcome === 'success' ? 'text-emerald-700' : 'text-red-600'}>
                              {evt.outcome}
                            </strong>
                          </span>
                        </div>
                        {evt.reason && <p className="text-on-surface italic">Reason: {evt.reason}</p>}
                        {(evt.previousValues || evt.newValues) && (
                          <div className="mt-1 pt-1 border-t border-outline text-[11px] text-on-surface-variant tabular-nums">
                            {evt.previousValues && <div>Prev: {JSON.stringify(evt.previousValues)}</div>}
                            {evt.newValues && <div>New: {JSON.stringify(evt.newValues)}</div>}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-on-surface-variant italic py-4 text-center">
                      No audit records logged for this inquiry.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </InquiryDetailShell>

      {/* Reassign Agent Dialog */}
      <Dialog open={reassignModalOpen} onOpenChange={setReassignModalOpen}>
        <DialogContent
          data-testid="broker-dialog"
          className="max-w-2xl bg-surface border border-outline text-on-surface"
        >
          <DialogHeader>
            <DialogTitle>Reassign Inquiry to Consultant</DialogTitle>
            <DialogDescription>
              Select a licensed agent to take over communication with {inquiry?.client_name}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4 py-2">
            <Field>
              <FieldLabel>Select Active Consultant</FieldLabel>
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto custom-scrollbar">
                {agents.map((ag) => (
                  <Label
                    key={ag.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors normal-case tracking-normal ${
                      selectedAgentId === ag.id
                        ? 'border-primary bg-teal-50/40'
                        : 'border-outline hover:border-outline-variant'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="agentSelect"
                        checked={selectedAgentId === ag.id}
                        onChange={() => setSelectedAgentId(ag.id)}
                        className="accent-[#0F766E]"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-sm text-on-surface">{ag.name}</span>
                        <span className="text-xs font-normal text-on-surface-variant tabular-nums">
                          {ag.assigned_properties_count} listings • {ag.active_inquiries_count} inquiries
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={ag.verification_status} />
                  </Label>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="reassign-audit-reason">Reassignment Audit Reason</FieldLabel>
              <Input
                id="reassign-audit-reason"
                type="text"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="e.g. Load balancing or specialist expertise"
                className="h-11"
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="gap-2 pt-3 border-t border-outline">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReassignModalOpen(false)}
              className="h-11"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveReassignment}
              disabled={saving}
              className="h-11"
            >
              {saving ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
