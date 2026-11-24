import { useContext, useEffect, useState } from 'react';
import { Building2, Send } from 'lucide-react';
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
  return combined || 'Visitor requested a licensed agent via AI Concierge.';
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
  onCancel,
  onSuccess,
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
      setError('Please accept the Data Privacy Act (RA 10173) notice to continue.');
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
      if (attachedProperty?.price !== null && attachedProperty?.price !== undefined) {
        payload.propertyPrice = attachedProperty.price;
      }

      const res = await apiClient.post('/inquiries', payload);
      const refId = res?.data?.data?.id || res?.data?.id || res?.id || 'submitted';
      onSuccess?.(refId);
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
      className="flex flex-col gap-2 p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] shrink-0"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#1E293B]">
          Connect to Licensed Agent
        </span>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

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
          I consent to Human Shelter Realty processing my contact details under the Data Privacy Act (RA 10173) so a licensed agent can respond.
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
        className="w-full min-h-11 bg-[#FF6B6B] text-[#1E293B] hover:bg-[#EE5A5A] font-semibold"
      >
        <Send data-icon="inline-start" />
        {isSubmitting ? 'Sending...' : 'Request Licensed Agent'}
      </Button>
    </form>
  );
}
