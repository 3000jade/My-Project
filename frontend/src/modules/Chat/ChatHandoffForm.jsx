import { useContext, useEffect, useState } from 'react';
import { Building2, Send, UserCheck } from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

function buildInquiryMessage(handoffSummary, recentMessages) {
  const summaryText = typeof handoffSummary === 'string' ? handoffSummary.trim() : '';
  const formattedLines = (Array.isArray(recentMessages) ? recentMessages : [])
    .slice(-4)
    .map((msg) => {
      const isVisitor = msg?.type === 'user' || msg?.role === 'user';
      const rawContent = msg?.text ?? msg?.content;
      const text = typeof rawContent === 'string' ? rawContent.trim() : '';
      return text ? `${isVisitor ? 'Visitor' : 'AI'}: ${text}` : null;
    })
    .filter(Boolean)
    .join('\n');

  const combined = [summaryText, formattedLines].filter(Boolean).join('\n');
  return combined || 'Visitor requested an agent via AI Assistant.';
}

/**
 * Consent-gated lead handoff form rendered inside the AI Property Concierge widget.
 *
 * @param {object} props
 * @param {object | null} [props.attachedProperty]
 * @param {string} [props.handoffSummary]
 * @param {Array<object>} [props.recentMessages]
 * @param {() => void} [props.onCancel]
 * @param {(referenceId: string) => void} [props.onSuccess]
 */
export default function ChatHandoffForm({
  attachedProperty = null,
  handoffSummary = '',
  recentMessages = [],
  mode = 'offline',
  selectedAgent = null,
  offlineNotice = '',
  onCancel,
  onSuccess,
  onLiveConnected,
}) {
  const auth = useContext(AuthContext);
  const authUser = auth?.user;

  const [name, setName] = useState(
    () => authUser?.fullName || authUser?.full_name || authUser?.name || ''
  );
  const [email, setEmail] = useState(() => authUser?.email || '');
  const [phone, setPhone] = useState(
    () => authUser?.phone || authUser?.phone_number || ''
  );
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authUser) return;
    const nextName = authUser.fullName || authUser.full_name || authUser.name || '';
    const nextEmail = authUser.email || '';
    const nextPhone = authUser.phone || authUser.phone_number || '';
    setName((prev) => prev || nextName);
    setEmail((prev) => prev || nextEmail);
    setPhone((prev) => prev || nextPhone);
  }, [authUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consentAccepted) {
      setError('Please agree to the privacy notice to continue.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        message: buildInquiryMessage(handoffSummary, recentMessages),
        source: 'ai_chatbot',
        preferredReplyChannel: 'chat',
        consentAccepted: true,
      };

      const trimmedPhone = phone.trim();
      if (trimmedPhone) {
        payload.phone = trimmedPhone;
      }
      if (attachedProperty?.id) {
        payload.propertyId = attachedProperty.id;
      }
      if (attachedProperty?.title) {
        payload.propertyTitle = attachedProperty.title;
      }
      const resolvedPropertyPrice = attachedProperty?.formattedPrice
        ? String(attachedProperty.formattedPrice)
        : attachedProperty?.price !== undefined && attachedProperty?.price !== null
          ? String(attachedProperty.price)
          : undefined;
      if (resolvedPropertyPrice !== undefined) {
        payload.propertyPrice = resolvedPropertyPrice;
      }

      if (mode === 'live') {
        if (selectedAgent?.id) {
          payload.selectedAgentId = selectedAgent.id;
        }
        if (attachedProperty?.city) {
          payload.city = attachedProperty.city;
        }
        if (attachedProperty?.propertyType) {
          payload.propertyType = attachedProperty.propertyType;
        }
        const res = await apiClient.post('/chat/live-handoff', payload);
        const sessionData = res?.data?.data || res?.data || res;
        onLiveConnected?.(sessionData);
      } else {
        const res = await apiClient.post('/inquiries', payload);
        const refId = res?.data?.data?.id || res?.data?.id || res?.id || 'submitted';
        onSuccess?.(refId);
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.data?.error ||
          'Could not submit your inquiry. Please check your details.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-lenis-prevent="true"
      className="flex flex-col gap-2 p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] min-h-0 max-h-full overflow-y-auto"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-semibold text-[#1E293B]">
          <UserCheck className="size-4 text-[#0F766E]" aria-hidden="true" />
          {mode === 'live'
            ? selectedAgent?.name
              ? `Chat with ${selectedAgent.name}`
              : 'Start Live Chat'
            : offlineNotice
              ? 'Leave a Message'
              : 'Talk to an Agent'}
        </span>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {offlineNotice && mode !== 'live' && (
        <Alert className="p-2 bg-amber-50 border-amber-200 text-amber-800">
          <AlertDescription className="text-xs">{offlineNotice}</AlertDescription>
        </Alert>
      )}

      {attachedProperty?.title && (
        <div className="flex items-center">
          <Badge variant="default" className="max-w-full">
            <Building2 className="size-4 shrink-0" />
            <span className="truncate">Property: {attachedProperty.title}</span>
          </Badge>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="handoff-name">Full name</Label>
        <Input
          id="handoff-name"
          type="text"
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="handoff-email">Email address</Label>
          <Input
            id="handoff-email"
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="handoff-phone">Phone (optional)</Label>
          <Input
            id="handoff-phone"
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="handoff-consent"
          checked={consentAccepted}
          onCheckedChange={(checked) => {
            const accepted = Boolean(checked);
            setConsentAccepted(accepted);
            if (accepted) {
              setError('');
            }
          }}
          className="mt-1"
        />
        <label
          htmlFor="handoff-consent"
          className="text-xs text-[#64748B] leading-relaxed cursor-pointer select-none"
        >
          I agree to let Human Shelter Realty use my contact details so an agent can reply to me (Data Privacy Act).
        </label>
      </div>

      {error && (
        <Alert variant="destructive" className="p-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        variant="ghost"
        loading={isSubmitting}
        disabled={!consentAccepted || isSubmitting}
        className="w-full min-h-11 bg-[#FF8559] text-white hover:bg-[#F07144] hover:text-white font-semibold"
      >
        <Send data-icon="inline-start" />
        {isSubmitting
          ? 'Connecting...'
          : mode === 'live'
            ? 'Start Live Chat'
            : 'Contact an Agent'}
      </Button>
    </form>
  );
}
