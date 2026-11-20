import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
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
  CardFooter,
  useToast,
  Toaster
} from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../../../components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import {
  ArrowLeft,
  UserPlus,
  Shield,
  Brain,
  MessageSquare,
  AlertCircle,
  Download
} from 'lucide-react';
import { inquiryService } from '../../../services/inquiryService';
import { Spinner, ViewPropertyButton } from '../../../components/ui';
import { InquiryDetailSkeleton } from '../../../components/dashboard/skeletons';
import { agentService } from '../../../services/agentService';

export default function BrokerInquiryDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [inquiry, setInquiry] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [agents, setAgents] = useState([]);
  const [reassignReason, setReassignReason] = useState('Reassigned by Broker');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | audit

  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const [data, audits, agentList] = await Promise.all([
          inquiryService.getInquiryById(id),
          inquiryService.getAuditEvents({ inquiryId: id }).catch(() => []),
          agentService.getAgents().catch(() => []),
        ]);
        if (mounted) {
          setAgents(Array.isArray(agentList) ? agentList : []);
          if (data) {
            setInquiry(data);
            setSelectedAgentId(data.agent_id || '');
            setAuditEvents(Array.isArray(audits) ? audits : []);
          } else {
            setError(`Inquiry with ID "${id}" could not be found.`);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Error loading inquiry details.');
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

  const handleSaveReassignment = async () => {
    const selectedAgent = agents.find(a => a.id === selectedAgentId) || { id: selectedAgentId, name: 'Assigned Specialist' };
    if (!selectedAgentId || !inquiry) return;

    setSaving(true);
    try {
      const updated = await inquiryService.assignAgent(inquiry.id, selectedAgentId, reassignReason);
      setInquiry(updated);
      const refreshedAudits = await inquiryService.getAuditEvents({ inquiryId: inquiry.id });
      setAuditEvents(refreshedAudits);
      toast({
        title: 'Specialist Reassigned',
        description: `Inquiry successfully reassigned to ${selectedAgent.name}.`,
        variant: 'success'
      });
    } catch (err) {
      console.warn('Reassignment API call failed, falling back to local update:', err.message);
      const updated = await inquiryService.updateInquiry(inquiry.id, {
        agent_id: selectedAgent.id,
        agent_name: selectedAgent.name,
        status: 'ASSIGNED',
      });
      setInquiry(updated);
      toast({
        title: 'Reassigned Locally',
        description: `Consultant reassigned to ${selectedAgent.name}.`,
        variant: 'primary'
      });
    } finally {
      setSaving(false);
      setReassignModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <InquiryDetailSkeleton />
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
        <PageHeader title="Inquiry Not Found" />
        <Alert variant="destructive" className="p-6 flex flex-col items-center text-center gap-3">
          <AlertCircle className="size-8" />
          <AlertTitle className="text-lg font-bold font-display">Inquiry Record Unavailable</AlertTitle>
          <AlertDescription className="text-sm max-w-md">
            {error || "The inquiry record could not be loaded."}
          </AlertDescription>
          <Button asChild className="mt-2 bg-[#0F766E] hover:bg-[#115E59] text-white">
            <Link to="/broker/inquiries">Back to Inquiries</Link>
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full font-sans" data-testid="broker-inquiry-detail">
      <Toaster />
      <PageHeader
        title={`Inquiry Dossier: ${inquiry.client_name}`}
        subtitle={`Session Ref: ${inquiry.reference_code || inquiry.id} • Created ${inquiry.created_at}`}
        badge={
          <div className="flex items-center gap-2">
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
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="h-11 px-4 border-[#E2E8F0] dark:border-slate-800 gap-1.5">
              <Link to="/broker/inquiries">
                <ArrowLeft className="size-4" />
                <span>Back</span>
              </Link>
            </Button>
            <Button
              type="button"
              onClick={() => setReassignModalOpen(true)}
              aria-label="Reassign Agent"
              className="h-11 px-5 bg-[#0F766E] hover:bg-[#115E59] text-white gap-2"
            >
              <UserPlus className="size-4" />
              <span>Reassign Agent</span>
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col gap-6">
        <TabsList className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-1 h-auto w-fit">
          <TabsTrigger value="overview" className="text-xs font-semibold px-4 py-2">
            Inquiry Overview &amp; Thread
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs font-semibold px-4 py-2 gap-1.5">
            <Shield className="size-3.5" />
            <span>Protected Audit Log ({auditEvents.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: AI Insights & Message Thread */}
            <div className="lg:col-span-8 min-w-0 flex flex-col gap-6">
              {inquiry.ai_summary && (
                <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#0F766E]/30 dark:border-teal-800/60 shadow-xs">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-[#0F766E] dark:text-teal-400 font-display font-bold text-sm">
                      <Brain className="size-4" />
                      <span>AI Inbound Inquiry Intelligence Analysis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
                      {inquiry.ai_summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs flex flex-col h-[500px]">
                <CardHeader className="pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-sans flex items-center gap-2">
                    <MessageSquare className="size-4 text-[#0F766E] dark:text-teal-400" />
                    <span>Communication Audit History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto py-4 flex flex-col gap-4 custom-scrollbar" data-lenis-prevent="true">
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
                </CardContent>
              </Card>
            </div>

            {/* Right 4 Cols: Assigned Agent, Client Dossier & Property Info */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-sans">
                    Supervising Consultant
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex items-center gap-3">
                  <div className="size-11 rounded-full bg-[#0F766E]/10 text-[#0F766E] dark:text-teal-400 flex items-center justify-center font-bold">
                    {(inquiry.agent_name || 'U').charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1E293B] dark:text-slate-100 font-sans">{inquiry.agent_name || 'Unassigned'}</p>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 font-sans">Assigned Consultant</p>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setReassignModalOpen(true)}
                    className="w-full h-11 text-xs font-bold uppercase tracking-wider hover:bg-[#0F766E] hover:text-white"
                  >
                    Reassign to Different Agent
                  </Button>
                </CardFooter>
              </Card>

              <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 text-[10px]">
                    Client Dossier
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col gap-1.5 text-xs font-sans">
                  <p className="font-bold text-sm text-[#1E293B] dark:text-slate-100">{inquiry.client_name}</p>
                  <p className="text-slate-600 dark:text-slate-400">Email: {inquiry.client_email}</p>
                  <p className="text-slate-600 dark:text-slate-400">Phone: {inquiry.client_phone}</p>
                </CardContent>
              </Card>

              <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 text-[10px] font-sans">
                    Property Referenced
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col gap-2">
                  <p className="font-bold text-sm text-[#1E293B] dark:text-slate-100 font-sans">{inquiry.property_title}</p>
                  <p className="text-base font-bold font-mono text-[#0F766E] dark:text-teal-400">{inquiry.property_price}</p>
                  <div className="pt-1">
                    <ViewPropertyButton
                      to={`/broker/properties/${inquiry.property_id}/edit`}
                      size="sm"
                      label="Edit property"
                      title="Edit Property in Studio"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-0">
          <Card data-testid="broker-protected-audit-viewer" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-4">
              <div>
                <CardTitle className="text-sm font-bold text-[#1E293B] dark:text-slate-100 flex items-center gap-2">
                  <Shield className="size-4 text-[#0F766E] dark:text-teal-400" />
                  <span>Protected Broker Audit Evidence</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#64748B] dark:text-slate-400">
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
                className="gap-1.5 text-xs font-semibold"
              >
                <Download className="size-3.5" />
                <span>Export Audit JSON</span>
              </Button>
            </CardHeader>

            <CardContent className="pt-4 flex flex-col gap-3">
              {auditEvents && auditEvents.length > 0 ? (
                auditEvents.map((evt) => (
                  <div key={evt.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#0F766E] dark:text-teal-400">{evt.eventType}</span>
                      <span className="text-[10px] font-mono text-slate-400">{evt.createdAt}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#64748B] dark:text-slate-400">
                      <span>Actor: <strong>{evt.actorName}</strong> ({evt.actorRole || 'system'})</span>
                      <span>•</span>
                      <span>Outcome: <strong className={evt.outcome === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>{evt.outcome}</strong></span>
                    </div>
                    {evt.reason && (
                      <p className="text-slate-700 dark:text-slate-300 italic">Reason: {evt.reason}</p>
                    )}
                    {(evt.previousValues || evt.newValues) && (
                      <div className="mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                        {evt.previousValues && <div>Prev: {JSON.stringify(evt.previousValues)}</div>}
                        {evt.newValues && <div>New: {JSON.stringify(evt.newValues)}</div>}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#64748B] dark:text-slate-400 italic py-4 text-center">No audit records logged for this inquiry.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reassign Agent Dialog */}
      <Dialog open={reassignModalOpen} onOpenChange={setReassignModalOpen}>
        <DialogContent
          data-testid="broker-dialog"
          className="max-w-2xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 text-[#1E293B] dark:text-slate-100"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1E293B] dark:text-slate-100 font-display">
              Reassign Inquiry to Consultant
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B] dark:text-slate-400">
              Select a licensed agent to take over communication with {inquiry.client_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 font-sans">
              Select Active Consultant
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
              {agents.map(ag => (
                <label
                  key={ag.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedAgentId === ag.id
                      ? 'border-[#0F766E] bg-teal-50/40 dark:bg-teal-950/40'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
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
                    <div>
                      <p className="font-bold text-xs text-[#1E293B] dark:text-slate-100 font-sans">{ag.name}</p>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-sans">{ag.assigned_properties_count} listings • {ag.active_inquiries_count} inquiries</p>
                    </div>
                  </div>
                  <StatusBadge status={ag.verification_status} />
                </label>
              ))}
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 font-sans">
                Reassignment Audit Reason
              </label>
              <input
                type="text"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="e.g. Load balancing or specialist expertise"
                className="w-full h-[40px] px-3 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded text-xs text-[#1E293B] dark:text-slate-100 outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
            <button
              type="button"
              onClick={() => setReassignModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 font-sans cursor-pointer hover:text-[#1E293B] dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveReassignment}
              disabled={saving}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
            >
              {saving ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
