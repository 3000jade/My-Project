import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import InquiryDetailShell from '../../../components/inquiries/InquiryDetailShell';
import InquiryConversationPanel from '../../../components/inquiries/InquiryConversationPanel';
import { useToast } from '../../../components/ui';
import { clientUserService } from '../../../services/clientUserService';

export default function ClientInquiryDetail() {
  const { id } = useParams();
  const { toast } = useToast();

  const [inquiry, setInquiry] = useState(null);
  const [allInquiries, setAllInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const list = await clientUserService.getClientInquiries();
        if (!mounted) return;
        const safeList = Array.isArray(list) ? list : [];
        setAllInquiries(safeList);
        const found = safeList.find((i) => String(i.id) === String(id));
        if (found) {
          setInquiry(found);
        } else {
          setError(`Inquiry "${id}" was not found.`);
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load inquiry details.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDetail();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSendReply = async (content) => {
    if (!content || !inquiry) return;
    setSendingReply(true);
    try {
      const updated = await clientUserService.addInquiryMessage(inquiry.id, content);
      setInquiry(updated);
      toast({ title: 'Message Sent', description: 'Your message was delivered.', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Message Failed',
        description: err.message || 'Could not send message.',
        variant: 'destructive',
      });
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <InquiryDetailShell
      testId="client-inquiry-detail"
      loading={loading}
      error={error}
      inquiry={inquiry}
      backTo="/client/inquiries"
      backLabel="Back to My Inquiries"
      breadcrumbs={[
        { label: 'Dashboard', to: '/client/dashboard' },
        { label: 'My Inquiries', to: '/client/inquiries' },
        { label: inquiry?.property_title || 'Detail' },
      ]}
      title={inquiry?.property_title || 'Inquiry Detail'}
      subtitle={
        inquiry
          ? `Ref: ${inquiry.reference_code || inquiry.id} • Consultant: ${
              inquiry.agent_name || 'Awaiting agent assignment'
            }`
          : ''
      }
      badge={inquiry && <StatusBadge status={inquiry.status || 'NEW'} />}
      allItems={allInquiries}
    >
      {inquiry && (
        <InquiryConversationPanel
          inquiry={inquiry}
          viewerRole="client"
          propertyLinkTo={inquiry.property_id ? `/properties/${inquiry.property_id}` : undefined}
          propertyLinkLabel="View listing"
          onSendReply={handleSendReply}
          sendingReply={sendingReply}
        />
      )}
    </InquiryDetailShell>
  );
}
