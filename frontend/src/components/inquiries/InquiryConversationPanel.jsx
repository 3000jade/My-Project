import React, { useState } from 'react';
import { MessageSquare, Send, Building2, User } from 'lucide-react';
import ViewPropertyButton from '../ui/buttons/ViewPropertyButton';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Input,
  ShadcnButton as Button,
} from '../ui';

export default function InquiryConversationPanel({
  inquiry,
  viewerRole = 'agent', // 'broker' | 'agent' | 'client'
  propertyLinkTo,
  propertyLinkLabel = 'View property',
  onSendReply,
  sendingReply = false,
  readOnlyNotice,
}) {
  const [replyText, setReplyText] = useState('');

  if (!inquiry) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !onSendReply) return;
    const text = replyText.trim();
    setReplyText('');
    await onSendReply(text);
  };

  const messages = Array.isArray(inquiry.messages) ? inquiry.messages : [];

  return (
    <Card className="bg-surface border border-outline shadow-xs flex flex-col overflow-hidden">
      {/* Compact Context Strip */}
      <CardHeader className="p-4 border-b border-outline bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 min-w-0 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="size-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-on-surface truncate">
                {inquiry.property_title || 'Property Inquiry'}
              </p>
              {inquiry.property_price && (
                <p className="text-primary font-semibold tabular-nums">{inquiry.property_price}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <User className="size-4 text-on-surface-variant shrink-0" />
            {viewerRole === 'client' ? (
              <span className="text-on-surface-variant truncate">
                Consultant:{' '}
                <strong className="text-on-surface">
                  {inquiry.agent_name || 'Awaiting agent assignment'}
                </strong>
              </span>
            ) : (
              <span className="text-on-surface-variant truncate">
                {inquiry.client_email} • <span className="tabular-nums">{inquiry.client_phone}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {propertyLinkTo && (
            <ViewPropertyButton
              to={propertyLinkTo}
              size="sm"
              label={propertyLinkLabel}
              title={propertyLinkLabel}
            />
          )}
          <Badge variant="success" className="normal-case tracking-normal">
            ● Live thread
          </Badge>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent
        className="p-4 h-[380px] overflow-y-auto flex flex-col gap-4 custom-scrollbar"
        data-lenis-prevent="true"
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          <MessageSquare className="size-3.5 text-primary" />
          <span>Conversation History</span>
        </div>

        {messages.length > 0 ? (
          messages.map((msg, idx) => {
            const isOwnMessage =
              viewerRole === 'client'
                ? msg.sender === 'client'
                : msg.sender === 'agent' || msg.sender === 'broker';

            return (
              <div
                key={msg.id || idx}
                className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 text-xs text-on-surface-variant">
                  <span className="font-semibold text-on-surface">
                    {msg.sender_name || (isOwnMessage ? 'You' : 'Participant')}
                  </span>
                  <span>{msg.timestamp || 'Recent'}</span>
                  {isOwnMessage && msg.delivery_status && (
                    <span className="text-primary font-medium">
                      {msg.delivery_status === 'read' ? '✓✓ Read' : '✓ Sent'}
                    </span>
                  )}
                </div>
                <div
                  className={`max-w-md p-3.5 rounded-lg text-sm leading-relaxed ${
                    isOwnMessage
                      ? 'bg-primary text-white'
                      : 'bg-surface-variant text-on-surface'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center py-12 text-sm text-on-surface-variant">
            No conversation messages recorded yet.
          </p>
        )}
      </CardContent>

      {/* Reply Bar */}
      {onSendReply ? (
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-outline bg-surface flex gap-3 items-center"
        >
          <Input
            type="text"
            aria-label="Reply message"
            placeholder={
              viewerRole === 'client'
                ? 'Write a follow-up question or viewing update...'
                : 'Type your reply to the client...'
            }
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 h-11"
          />
          <Button
            type="submit"
            disabled={sendingReply || !replyText.trim()}
            className="h-11 px-5 shrink-0"
          >
            <span>{sendingReply ? 'Sending...' : 'Send'}</span>
            <Send data-icon="inline-end" />
          </Button>
        </form>
      ) : readOnlyNotice ? (
        <div className="px-4 py-3 border-t border-outline bg-background text-xs text-on-surface-variant">
          {readOnlyNotice}
        </div>
      ) : null}
    </Card>
  );
}
