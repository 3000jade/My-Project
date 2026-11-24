import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Building2,
  User,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  PanelRightOpen,
  PanelRightClose,
  Calendar,
} from 'lucide-react';
import ViewPropertyButton from '../ui/buttons/ViewPropertyButton';
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Input,
  ShadcnButton as Button,
} from '../ui';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from '../ui/message-scroller';
import {
  MessageGroup,
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
} from '../ui/message';
import { Bubble, BubbleContent } from '../ui/bubble';
import { Marker, MarkerIcon, MarkerContent } from '../ui/marker';
import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from '../ui/attachment';

const QUICK_REPLIES_BY_ROLE = {
  client: [
    'Is this property still available?',
    'Can we schedule a viewing?',
    'Please share the floor plan.',
  ],
  agent: [
    'Yes, this listing is still available.',
    'Would Saturday at 2:00 PM work for a viewing?',
    'Sending over the floor plan and details.',
  ],
  broker: [
    'A consultant will follow up shortly.',
    'Confirming availability for your requested schedule.',
    'Please let us know your preferred viewing time.',
  ],
};

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatFileSize(bytes) {
  if (!bytes || typeof bytes !== 'number') return 'File';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMessageTimestamp(raw) {
  if (!raw) return 'Recent';
  const str = String(raw).trim();
  if (!/\d{4}-\d{2}-\d{2}/.test(str)) return str;
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return str;

  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  const day = parsed.toLocaleDateString('en-US', { weekday: 'short' });
  const time = parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${yyyy}-${mm}-${dd} (${day}) • ${time}`;
}

export default function InquiryConversationPanel({
  inquiry,
  viewerRole = 'agent', // 'broker' | 'agent' | 'client'
  propertyLinkTo,
  propertyLinkLabel = 'View property',
  onSendReply,
  sendingReply = false,
  readOnlyNotice,
  onToggleInspector,
  inspectorOpen = false,
}) {
  const [replyText, setReplyText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const fileInputRef = useRef(null);

  if (!inquiry) return null;

  const messages = Array.isArray(inquiry.messages) ? inquiry.messages : [];
  const quickReplies = QUICK_REPLIES_BY_ROLE[viewerRole] || QUICK_REPLIES_BY_ROLE.agent;
  const canSend = Boolean(onSendReply) && (replyText.trim().length > 0 || pendingAttachments.length > 0);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const mapped = files.map((file, index) => ({
      id: `att-${Date.now()}-${index}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      file,
    }));

    setPendingAttachments((prev) => [...prev, ...mapped]);
    e.target.value = '';
  };

  const handleRemoveAttachment = (attId) => {
    setPendingAttachments((prev) => {
      const target = prev.find((a) => a.id === attId);
      if (target?.url && target.url.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((a) => a.id !== attId);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSend || sendingReply) return;

    const text = replyText.trim();
    const attachmentsToSend = pendingAttachments.map(({ id, name, size, type, url }) => ({
      id,
      name,
      size,
      type,
      url,
    }));

    setReplyText('');
    setPendingAttachments([]);

    const fallbackText =
      text ||
      (attachmentsToSend.length === 1
        ? `Sent attachment: ${attachmentsToSend[0].name}`
        : `Sent ${attachmentsToSend.length} attachments`);

    await onSendReply(fallbackText, attachmentsToSend);
  };

  return (
    <Card className="bg-surface border border-outline shadow-xs flex flex-col overflow-hidden h-full">
      {/* Pinned Property & Participant Context Strip */}
      <CardHeader className="p-4 border-b border-outline bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-4 min-w-0 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center shrink-0 border border-outline">
              <Building2 className="size-4" />
            </div>
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
                <strong className="text-on-surface">{inquiry.client_name}</strong>
                {inquiry.client_email ? ` • ${inquiry.client_email}` : ''}
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
          {onToggleInspector && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleInspector}
              aria-label={inspectorOpen ? 'Hide inquiry details' : 'Show inquiry details'}
              className="min-h-11 sm:min-h-9 px-2.5 gap-1.5"
            >
              {inspectorOpen ? (
                <PanelRightClose className="size-4" />
              ) : (
                <PanelRightOpen className="size-4" />
              )}
              <span className="hidden xl:inline">{inspectorOpen ? 'Hide Info' : 'Details'}</span>
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Scrollable Message Thread using shadcn/ui MessageScroller + Message + Bubble */}
      <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
        <div className="relative min-h-[280px] flex-1" data-lenis-prevent="true">
          <MessageScrollerProvider autoScroll>
            <MessageScroller className="h-full">
              <MessageScrollerViewport className="p-4">
                <MessageScrollerContent className="gap-4">
                  <MessageScrollerItem messageId="thread-start">
                    <Marker variant="separator" className="text-xs text-on-surface-variant">
                      <MarkerIcon>
                        <MessageSquare className="size-3.5 text-primary" />
                      </MarkerIcon>
                      <MarkerContent>
                        Inquiry started {inquiry.created_at ? formatMessageTimestamp(inquiry.created_at) : 'recently'}
                      </MarkerContent>
                    </Marker>
                  </MessageScrollerItem>

                  {inquiry.status === 'SCHEDULED' && (
                    <MessageScrollerItem messageId="tour-status-marker">
                      <Marker variant="border" className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <MarkerIcon>
                          <Calendar className="size-3.5 text-blue-700" />
                        </MarkerIcon>
                        <MarkerContent>
                          Viewing scheduled
                          {inquiry.preferred_date ? ` for ${inquiry.preferred_date}` : ''}
                        </MarkerContent>
                      </Marker>
                    </MessageScrollerItem>
                  )}

                  {messages.length > 0 ? (
                    <MessageGroup className="gap-4">
                      {messages.map((msg, idx) => {
                        const isOwnMessage =
                          viewerRole === 'client'
                            ? msg.sender === 'client'
                            : msg.sender === 'agent' || msg.sender === 'broker';
                        const senderLabel =
                          msg.sender_name || (isOwnMessage ? 'You' : 'Participant');
                        const msgAttachments = Array.isArray(msg.attachments) ? msg.attachments : [];

                        return (
                          <MessageScrollerItem
                            key={msg.id || idx}
                            messageId={String(msg.id || idx)}
                            scrollAnchor={isOwnMessage}
                          >
                            <Message align={isOwnMessage ? 'end' : 'start'}>
                              <MessageAvatar>
                                <Avatar size="default">
                                  <AvatarFallback
                                    className={
                                      isOwnMessage
                                        ? 'bg-teal-100 text-primary font-semibold text-xs'
                                        : 'bg-surface-variant text-on-surface font-semibold text-xs'
                                    }
                                  >
                                    {getInitials(senderLabel)}
                                  </AvatarFallback>
                                </Avatar>
                              </MessageAvatar>
                              <MessageContent>
                                <MessageHeader className="gap-2">
                                  <span className="font-semibold text-on-surface">
                                    {senderLabel}
                                  </span>
                                  <span className="tabular-nums">
                                    {formatMessageTimestamp(msg.timestamp || msg.created_at)}
                                  </span>
                                </MessageHeader>

                                {msg.content && (
                                  <Bubble
                                    variant={isOwnMessage ? 'default' : 'muted'}
                                    align={isOwnMessage ? 'end' : 'start'}
                                  >
                                    <BubbleContent
                                      className={
                                        isOwnMessage
                                          ? 'bg-primary text-white rounded-2xl'
                                          : 'bg-surface-variant text-on-surface rounded-2xl'
                                      }
                                    >
                                      {msg.content}
                                    </BubbleContent>
                                  </Bubble>
                                )}

                                {msgAttachments.length > 0 && (
                                  <AttachmentGroup
                                    className={isOwnMessage ? 'justify-end' : 'justify-start'}
                                  >
                                    {msgAttachments.map((att, aIdx) => (
                                      <Attachment
                                        key={att.id || aIdx}
                                        size="sm"
                                        state="done"
                                        className="rounded-xl border-outline bg-surface"
                                      >
                                        <AttachmentMedia
                                          variant={att.type === 'image' && att.url ? 'image' : 'icon'}
                                          className="rounded-lg"
                                        >
                                          {att.type === 'image' && att.url ? (
                                            <img src={att.url} alt={att.name || 'Attachment'} />
                                          ) : (
                                            <FileText className="size-4 text-primary" />
                                          )}
                                        </AttachmentMedia>
                                        <AttachmentContent>
                                          <AttachmentTitle>{att.name || 'Attachment'}</AttachmentTitle>
                                          {att.size && (
                                            <AttachmentDescription>{att.size}</AttachmentDescription>
                                          )}
                                        </AttachmentContent>
                                      </Attachment>
                                    ))}
                                  </AttachmentGroup>
                                )}

                                {isOwnMessage && msg.delivery_status && (
                                  <MessageFooter className="text-primary font-medium">
                                    {msg.delivery_status === 'read' ? '✓✓ Read' : '✓ Sent'}
                                  </MessageFooter>
                                )}
                              </MessageContent>
                            </Message>
                          </MessageScrollerItem>
                        );
                      })}
                    </MessageGroup>
                  ) : (
                    <div className="text-center py-10 text-sm text-on-surface-variant">
                      No conversation messages recorded yet.
                    </div>
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton aria-label="Jump to latest message" />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>
      </CardContent>

      {/* Reply Bar with Quick-Reply Chips & File/Photo Attachments */}
      {onSendReply ? (
        <div className="border-t border-outline bg-surface p-4 flex flex-col gap-2 shrink-0">
          {/* Quick-reply starter chips */}
          <div className="flex flex-wrap items-center gap-2">
            {quickReplies.map((chip) => (
              <Button
                key={chip}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReplyText(chip)}
                className="rounded-full min-h-9 px-3 text-xs text-on-surface-variant hover:text-primary hover:border-primary"
              >
                {chip}
              </Button>
            ))}
          </div>

          {/* Pending attachment previews */}
          {pendingAttachments.length > 0 && (
            <AttachmentGroup>
              {pendingAttachments.map((att) => (
                <Attachment
                  key={att.id}
                  size="sm"
                  state="idle"
                  className="rounded-xl border-outline bg-background"
                >
                  <AttachmentMedia
                    variant={att.type === 'image' && att.url ? 'image' : 'icon'}
                    className="rounded-lg"
                  >
                    {att.type === 'image' && att.url ? (
                      <img src={att.url} alt={att.name} />
                    ) : att.type === 'image' ? (
                      <ImageIcon className="size-4 text-primary" />
                    ) : (
                      <FileText className="size-4 text-primary" />
                    )}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{att.name}</AttachmentTitle>
                    <AttachmentDescription>{att.size}</AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction
                      type="button"
                      aria-label={`Remove ${att.name}`}
                      onClick={() => handleRemoveAttachment(att.id)}
                    >
                      <X className="size-3.5" />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ))}
            </AttachmentGroup>
          )}

          {/* Message input form */}
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Attach photos or files"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach photo or file"
              className="size-11 shrink-0"
            >
              <Paperclip className="size-4" />
            </Button>
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
              disabled={sendingReply || !canSend}
              className="h-11 px-5 shrink-0"
            >
              <Send data-icon="inline-start" />
              <span>{sendingReply ? 'Sending...' : 'Send'}</span>
            </Button>
          </form>
        </div>
      ) : readOnlyNotice ? (
        <div className="px-4 py-3 border-t border-outline bg-background text-xs text-on-surface-variant shrink-0">
          {readOnlyNotice}
        </div>
      ) : null}
    </Card>
  );
}
