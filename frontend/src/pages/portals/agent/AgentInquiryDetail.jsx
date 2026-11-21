import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarPlus, CheckCircle2, History } from 'lucide-react';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import InquiryDetailShell from '../../../components/inquiries/InquiryDetailShell';
import InquiryConversationPanel from '../../../components/inquiries/InquiryConversationPanel';
import InquiryAiSummaryCard from '../../../components/inquiries/InquiryAiSummaryCard';
import InquiryFollowUpTasksCard from '../../../components/inquiries/InquiryFollowUpTasksCard';
import InquiryInternalNotesCard from '../../../components/inquiries/InquiryInternalNotesCard';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Textarea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ShadcnButton as Button,
  useToast,
} from '../../../components/ui';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Field, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { inquiryService } from '../../../services/inquiryService';

export default function AgentInquiryDetail() {
  const { id } = useParams();
  const { toast } = useToast();

  const [inquiry, setInquiry] = useState(null);
  const [allInquiries, setAllInquiries] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [detailTab, setDetailTab] = useState('conversation');
  const [sendingReply, setSendingReply] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetBusinessStatus, setTargetBusinessStatus] = useState('inactive');
  const [inactivateOutcome, setInactivateOutcome] = useState('lost');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('2026-09-28');
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [appointmentType, setAppointmentType] = useState('Site Visit');
  const [schedulingViewing, setSchedulingViewing] = useState(false);
  const [appointmentConfirmedMessage, setAppointmentConfirmedMessage] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const [data, allList] = await Promise.all([
          inquiryService.getInquiryById(id),
          inquiryService.getInquiries?.()?.catch(() => []) || Promise.resolve([]),
        ]);
        if (!mounted) return;
        setAllInquiries(Array.isArray(allList) ? allList : []);
        if (data) {
          setInquiry(data);
          const [tl] = await Promise.all([
            inquiryService.getTimeline?.(id)?.catch(() => []) || Promise.resolve([]),
            inquiryService.markMessagesRead?.(id)?.catch(() => null) || Promise.resolve(null),
            inquiryService.reconnectInquiry?.(id)?.catch(() => null) || Promise.resolve(null),
          ]);
          if (mounted) setTimeline(Array.isArray(tl) ? tl : []);
        } else {
          setError(`Inquiry "${id}" was not found.`);
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to retrieve inquiry details.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSendReply = async (content) => {
    if (!content || !inquiry) return;
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
      toast({ title: 'Message Sent', description: 'Your reply was delivered.', variant: 'success' });
    } catch {
      const fallbackMsg = {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        sender_name: inquiry.agent_name || 'Assigned Specialist',
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
      toast({ title: 'Saved Locally', description: 'Reply queued in session.', variant: 'warning' });
    } finally {
      setSendingReply(false);
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
      toast({ title: 'Note Saved', description: 'Private staff note added.', variant: 'success' });
    } catch {
      const fallbackNote = {
        id: `note-${Date.now()}`,
        authorName: inquiry.agent_name || 'Assigned Specialist',
        authorRole: 'agent',
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

  const handleToggleTaskStatus = async (task) => {
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

  const handleGenerateSummary = async () => {
    if (!inquiry) return;
    setGeneratingSummary(true);
    try {
      const result = await inquiryService.generateAiSummary(inquiry.id);
      setInquiry((prev) => ({ ...prev, latest_ai_summary: result }));
      toast({ title: 'AI Summary Updated', description: 'Latest highlights extracted.', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Summary Failed',
        description: err.message || 'Could not regenerate AI summary.',
        variant: 'destructive',
      });
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
      toast({
        title: 'Status Updated',
        description: `Inquiry marked ${targetBusinessStatus}.`,
        variant: 'success',
      });
    } catch {
      setInquiry((prev) => ({
        ...prev,
        business_status: targetBusinessStatus,
        status: targetBusinessStatus === 'inactive' ? 'RESOLVED' : 'REOPENED',
      }));
      setShowStatusModal(false);
      setStatusReason('');
      toast({ title: 'Updated Locally', description: 'Status updated in current session.', variant: 'warning' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!inquiry) return;
    setSchedulingViewing(true);
    try {
      const updated = await inquiryService.scheduleViewing(
        inquiry.id,
        `${appointmentDate} ${appointmentTime}`,
        appointmentType
      );
      if (updated && updated.id) setInquiry(updated);
      setAppointmentConfirmedMessage(true);
      toast({
        title: 'Viewing Scheduled',
        description: `${appointmentType} set for ${appointmentDate} at ${appointmentTime}.`,
        variant: 'success',
      });
    } catch {
      const scheduleMsg = {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        sender_name: inquiry.agent_name || 'Assigned Specialist',
        timestamp: 'Just now',
        content: `Appointment scheduled: ${appointmentType} on ${appointmentDate} at ${appointmentTime}.`,
      };
      setInquiry((prev) => ({
        ...prev,
        status: 'SCHEDULED',
        messages: [...(prev.messages || []), scheduleMsg],
        last_message: scheduleMsg.content,
      }));
      setAppointmentConfirmedMessage(true);
      toast({ title: 'Scheduled Locally', description: 'Viewing saved in current session.', variant: 'warning' });
    } finally {
      setSchedulingViewing(false);
    }

    setTimeout(() => {
      setAppointmentConfirmedMessage(false);
      setShowAppointmentModal(false);
    }, 1400);
  };

  const isInactive = inquiry?.business_status === 'inactive';

  return (
    <>
      <InquiryDetailShell
        testId="agent-inquiry-detail"
        loading={loading}
        error={error}
        inquiry={inquiry}
        backTo="/agent/inquiries"
        backLabel="Back to Overview"
        breadcrumbs={[
          { label: 'Dashboard', to: '/agent/dashboard' },
          { label: 'Inquiries', to: '/agent/inquiries' },
          { label: inquiry?.client_name || 'Detail' },
        ]}
        title={inquiry ? `Inquiry from ${inquiry.client_name}` : 'Inquiry Detail'}
        subtitle={
          inquiry ? `Reference: ${inquiry.reference_code || inquiry.id} • Registered ${inquiry.created_at}` : ''
        }
        badge={
          inquiry && (
            <div className="flex items-center gap-2">
              <Badge variant={isInactive ? 'secondary' : 'success'}>
                {isInactive ? 'Inactive Lead' : 'Active Lead'}
              </Badge>
              <StatusBadge status={inquiry.status} />
            </div>
          )
        }
        allItems={allInquiries}
        headerActions={
          inquiry && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTargetBusinessStatus(isInactive ? 'active' : 'inactive');
                  setShowStatusModal(true);
                }}
                className="h-11 px-4"
              >
                {isInactive ? 'Reactivate Inquiry' : 'Mark Inactive'}
              </Button>
              <Button
                type="button"
                variant="coral"
                onClick={() => setShowAppointmentModal(true)}
                className="h-11 px-4"
              >
                <CalendarPlus data-icon="inline-start" />
                <span>Schedule Viewing</span>
              </Button>
            </>
          )
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
              <TabsTrigger value="notes_timeline" className="min-h-10 text-xs font-semibold px-4 py-2">
                Notes &amp; Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="mt-0">
              <InquiryConversationPanel
                inquiry={inquiry}
                viewerRole="agent"
                propertyLinkTo={`/agent/properties/${inquiry.property_id}`}
                propertyLinkLabel="View property"
                onSendReply={handleSendReply}
                sendingReply={sendingReply}
              />
            </TabsContent>

            <TabsContent value="ai_tasks" className="mt-0 flex flex-col gap-6">
              <InquiryAiSummaryCard
                aiSummary={inquiry.latest_ai_summary}
                fallbackSummary={inquiry.ai_summary}
                generating={generatingSummary}
                onRefresh={handleGenerateSummary}
              />
              <InquiryFollowUpTasksCard
                tasks={inquiry.follow_up_tasks || []}
                onToggleTask={handleToggleTaskStatus}
                onCreateTask={handleCreateTask}
                creating={creatingTask}
              />
            </TabsContent>

            <TabsContent value="notes_timeline" className="mt-0 flex flex-col gap-6">
              <InquiryInternalNotesCard
                notes={inquiry.internal_notes || []}
                onAddNote={handleAddInternalNote}
                adding={addingNote}
              />
              <Card data-testid="inquiry-activity-timeline" className="bg-surface border border-outline shadow-xs">
                <CardHeader className="pb-3 border-b border-outline">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                    <History className="size-4 text-primary" />
                    <span>Activity Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-col gap-3 max-h-56 overflow-y-auto" data-lenis-prevent="true">
                    {timeline.length > 0 ? (
                      timeline.map((evt) => (
                        <div key={evt.id} className="text-xs border-l-2 border-primary pl-3 py-0.5 flex flex-col gap-0.5">
                          <p className="font-semibold text-on-surface">{evt.title}</p>
                          <p className="text-on-surface-variant leading-snug">{evt.description}</p>
                          <span className="text-[11px] text-on-surface-variant tabular-nums">
                            {evt.timestamp ? evt.timestamp.substring(0, 16).replace('T', ' ') : 'Recent'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-on-surface-variant italic py-1">No recorded timeline events.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </InquiryDetailShell>

      {/* Lifecycle Status Dialog */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-lg bg-surface border border-outline">
          <DialogHeader>
            <DialogTitle>
              {targetBusinessStatus === 'inactive' ? 'Mark Inquiry Inactive' : 'Reactivate Inquiry'}
            </DialogTitle>
            <DialogDescription>
              Record reason and outcome for client relationship tracking.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4 py-2">
            {targetBusinessStatus === 'inactive' && (
              <Field>
                <FieldLabel>Inactivation Outcome</FieldLabel>
                <Select value={inactivateOutcome} onValueChange={setInactivateOutcome}>
                  <SelectTrigger className="w-full h-11 rounded-lg border border-outline bg-surface px-3">
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="purchased">Purchased through firm</SelectItem>
                      <SelectItem value="withdrawn">Client withdrawn / paused search</SelectItem>
                      <SelectItem value="lost">Lost to competitor / alternative property</SelectItem>
                      <SelectItem value="unresponsive">Unresponsive after multiple contacts</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="status-transition-reason">Transition Reason (Required)</FieldLabel>
              <Textarea
                id="status-transition-reason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Explain why this inquiry is transitioning..."
                rows={3}
                className="resize-none"
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="gap-2 pt-3 border-t border-outline">
            <Button type="button" variant="outline" onClick={() => setShowStatusModal(false)} className="h-11">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveBusinessStatus}
              disabled={updatingStatus || !statusReason.trim()}
              className="h-11"
            >
              {updatingStatus ? 'Updating...' : 'Confirm Transition'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coordinate Appointment Dialog */}
      <Dialog open={showAppointmentModal} onOpenChange={setShowAppointmentModal}>
        <DialogContent className="max-w-lg bg-surface border border-outline">
          <DialogHeader>
            <DialogTitle>Coordinate Client Appointment</DialogTitle>
            <DialogDescription>
              Schedule a viewing or consultation with {inquiry?.client_name}
            </DialogDescription>
          </DialogHeader>

          {appointmentConfirmedMessage ? (
            <div className="p-6 text-center flex flex-col items-center gap-2">
              <CheckCircle2 className="size-12 text-primary" />
              <h4 className="text-base font-bold text-on-surface">Appointment Scheduled</h4>
              <p className="text-xs text-on-surface-variant">
                Viewing registered for {appointmentDate} at {appointmentTime}.
              </p>
            </div>
          ) : (
            <FieldGroup className="gap-4 py-2">
              <Field>
                <FieldLabel>Appointment Type</FieldLabel>
                <Select value={appointmentType} onValueChange={setAppointmentType}>
                  <SelectTrigger className="w-full h-11 rounded-lg border border-outline bg-surface px-3">
                    <SelectValue placeholder="Select appointment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Site Visit">Site Visit / Ocular Tour</SelectItem>
                      <SelectItem value="Online Consultation">Online Consultation (Zoom / Teams)</SelectItem>
                      <SelectItem value="Document Signing">Document Signing</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="appointment-date">Date</FieldLabel>
                  <Input
                    id="appointment-date"
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="h-11"
                  />
                </Field>
                <Field>
                  <FieldLabel>Time</FieldLabel>
                  <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                    <SelectTrigger className="w-full h-11 rounded-lg border border-outline bg-surface px-3">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="09:00 AM">09:00 AM</SelectItem>
                        <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                        <SelectItem value="02:00 PM">02:00 PM</SelectItem>
                        <SelectItem value="04:00 PM">04:00 PM</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
          )}

          {!appointmentConfirmedMessage && (
            <DialogFooter className="gap-2 pt-3 border-t border-outline">
              <Button type="button" variant="outline" onClick={() => setShowAppointmentModal(false)} className="h-11">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateAppointment}
                disabled={schedulingViewing}
                className="h-11"
              >
                {schedulingViewing ? 'Scheduling...' : 'Confirm Schedule'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
