import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  Inbox,
  Mail,
  Phone,
  Sparkles,
  User,
} from 'lucide-react';
import StatusBadge from '../dashboard/StatusBadge';
import InquiryConversationPanel from './InquiryConversationPanel';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  ShadcnButton as Button,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '../ui';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '../ui/empty';

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'IN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function InquiryInboxSplitView({
  items = [],
  viewerRole = 'agent',
  basePath = '/inquiries',
  onSendReply,
  sendingReply = false,
  onResetFilters,
  filterToolbar = null,
}) {
  const [selectedId, setSelectedId] = useState(items[0]?.id || null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null);
      return;
    }
    const stillExists = items.some((i) => String(i.id) === String(selectedId));
    if (!stillExists) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const selectedInquiry =
    items.find((i) => String(i.id) === String(selectedId)) || items[0] || null;

  const handleSelectThread = (item) => {
    setSelectedId(item.id);
    setMobileShowChat(true);
  };

  const handleToggleInspector = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setInspectorOpen((prev) => !prev);
    }
  };

  const propertyLinkTo = selectedInquiry
    ? viewerRole === 'broker'
      ? `/broker/properties/${selectedInquiry.property_id}/edit`
      : viewerRole === 'agent'
      ? `/agent/properties/${selectedInquiry.property_id}`
      : `/properties/${selectedInquiry.property_id}`
    : null;

  const renderInspectorContent = (inq) => {
    if (!inq) return null;
    return (
      <div className="flex flex-col gap-4">
        {/* Contact / Consultant Identity */}
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback className="bg-teal-100 text-primary font-semibold">
              {getInitials(viewerRole === 'client' ? inq.agent_name || 'HS' : inq.client_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-on-surface text-sm truncate">
              {viewerRole === 'client'
                ? inq.agent_name || 'Awaiting Consultant'
                : inq.client_name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={inq.status || 'NEW'} />
              <span className="text-xs text-on-surface-variant tabular-nums">
                {inq.reference_code || inq.id}
              </span>
            </div>
          </div>
        </div>

        {viewerRole !== 'client' && (
          <div className="flex flex-col gap-2 rounded-lg border border-outline bg-background p-3 text-xs">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Mail className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">{inq.client_email || 'No email provided'}</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant tabular-nums">
              <Phone className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">{inq.client_phone || 'No phone provided'}</span>
            </div>
            {inq.agent_name && (
              <div className="flex items-center gap-2 text-on-surface-variant">
                <User className="size-3.5 shrink-0 text-primary" />
                <span className="truncate">Assigned: {inq.agent_name}</span>
              </div>
            )}
          </div>
        )}

        {/* Property Snapshot */}
        <div className="rounded-lg border border-outline bg-surface p-3 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Property Snapshot
          </p>
          <div className="flex items-start gap-2">
            <Building2 className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-on-surface truncate">
                {inq.property_title || 'Property Inquiry'}
              </p>
              <p className="text-xs font-semibold text-primary tabular-nums">
                {inq.property_price || 'Price upon request'}
              </p>
            </div>
          </div>
          {propertyLinkTo && (
            <Button asChild variant="outline" size="sm" className="w-full min-h-10 mt-1">
              <Link to={propertyLinkTo}>
                <span>View Listing</span>
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          )}
        </div>

        {/* Tour / Next Steps Card */}
        {inq.status === 'SCHEDULED' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex flex-col gap-1 text-xs text-blue-700">
            <div className="flex items-center gap-2 font-semibold">
              <Calendar className="size-4 shrink-0" />
              <span>Viewing Scheduled</span>
            </div>
            <p>
              {inq.preferred_date
                ? `Scheduled for ${inq.preferred_date}`
                : 'A viewing appointment is linked to this inquiry.'}
            </p>
          </div>
        )}

        {/* Staff AI Summary Snippet */}
        {viewerRole !== 'client' && (inq.latest_ai_summary?.summary || inq.ai_summary) && (
          <div className="rounded-lg border border-outline bg-background p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5 shrink-0" />
              <span>Lead Summary</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {inq.latest_ai_summary?.summary || inq.ai_summary}
            </p>
          </div>
        )}

        <Button asChild className="w-full h-11">
          <Link to={`${basePath}/${inq.id}`}>
            <span>Open Full Inquiry Workspace</span>
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    );
  };

  if (items.length === 0 && !filterToolbar) {
    return (
      <Card className="bg-surface border border-outline shadow-xs">
        <CardContent className="p-0">
          <Empty className="p-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>No inquiries found</EmptyTitle>
              <EmptyDescription>
                Try switching queue tabs or clearing your search and filters.
              </EmptyDescription>
            </EmptyHeader>
            {onResetFilters && (
              <Button type="button" onClick={onResetFilters} className="min-h-11 mt-2">
                Reset Filters
              </Button>
            )}
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch min-w-0 lg:h-[calc(100vh-13rem)] lg:min-h-[560px]">
        {/* Pane 1: Conversation Thread List */}
        <Card
          className={`lg:col-span-4 xl:col-span-3 bg-surface border border-outline shadow-xs flex flex-col overflow-hidden min-w-0 h-full ${
            mobileShowChat ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <CardHeader className="p-4 border-b border-outline bg-background flex flex-row items-center justify-between gap-2 shrink-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface">
              Conversations
            </CardTitle>
            <Badge variant="outline" className="tabular-nums">
              {items.length}
            </Badge>
          </CardHeader>
          {filterToolbar && (
            <div className="p-3 border-b border-outline bg-background/50 shrink-0">
              {filterToolbar}
            </div>
          )}
          <CardContent className="p-2 flex flex-col gap-1 flex-1 min-h-0 max-h-[620px] lg:max-h-none overflow-y-auto custom-scrollbar">
            {items.length === 0 ? (
              <Empty className="p-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Inbox />
                  </EmptyMedia>
                  <EmptyTitle>No inquiries found</EmptyTitle>
                  <EmptyDescription>
                    Try adjusting your search or filters above.
                  </EmptyDescription>
                </EmptyHeader>
                {onResetFilters && (
                  <Button type="button" onClick={onResetFilters} className="min-h-11 mt-2">
                    Reset Filters
                  </Button>
                )}
              </Empty>
            ) : items.map((item) => {
              const isSelected = String(item.id) === String(selectedInquiry?.id);
              const isUnread = (item.status || '').toUpperCase() === 'NEW';
              const displayTitle =
                viewerRole === 'client'
                  ? item.property_title || 'Property Inquiry'
                  : item.client_name || 'Client Inquiry';
              const displaySub =
                viewerRole === 'client'
                  ? item.agent_name || 'Awaiting consultant'
                  : item.property_title || 'General Inquiry';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectThread(item)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors min-h-11 flex items-start gap-3 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 ${
                    isSelected
                      ? 'bg-tertiary-container/50 border-primary'
                      : 'bg-surface border-transparent hover:bg-surface-variant/70'
                  }`}
                >
                  <Avatar size="default" className="mt-0.5 shrink-0">
                    <AvatarFallback className="bg-teal-100 text-primary font-semibold text-xs">
                      {getInitials(displayTitle)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-on-surface truncate">
                        {displayTitle}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant tabular-nums shrink-0">
                        {isUnread && (
                          <span
                            className="size-2 rounded-full bg-accent shrink-0"
                            aria-label="New unread inquiry"
                          />
                        )}
                        <Clock className="size-3 shrink-0" />
                        <span>{String(item.created_at || '').slice(0, 10) || 'Recent'}</span>
                      </span>
                    </div>

                    <p className="text-xs font-medium text-primary truncate">{displaySub}</p>
                    <p className="text-xs text-on-surface-variant line-clamp-1">
                      {item.last_message || 'No messages yet'}
                    </p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Pane 2: Active Chat Thread */}
        <div
          className={`min-w-0 flex flex-col h-full ${
            inspectorOpen ? 'lg:col-span-5 xl:col-span-6' : 'lg:col-span-8 xl:col-span-9'
          } ${mobileShowChat ? 'flex' : 'hidden lg:flex'}`}
        >
          {/* Mobile Back-to-List Bar */}
          <div className="flex lg:hidden items-center justify-between gap-2 mb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMobileShowChat(false)}
              className="min-h-11 px-3"
            >
              <ArrowLeft data-icon="inline-start" />
              <span>All Conversations</span>
            </Button>
          </div>

          <InquiryConversationPanel
            inquiry={selectedInquiry}
            viewerRole={viewerRole}
            propertyLinkTo={propertyLinkTo}
            propertyLinkLabel={viewerRole === 'broker' ? 'Edit property' : 'View property'}
            onSendReply={
              onSendReply && selectedInquiry
                ? (text, attachments) => onSendReply(selectedInquiry.id, text, attachments)
                : undefined
            }
            sendingReply={sendingReply}
            inspectorOpen={inspectorOpen}
            onToggleInspector={handleToggleInspector}
          />
        </div>

        {/* Pane 3: Desktop Collapsible Context Inspector */}
        {inspectorOpen && selectedInquiry && (
          <Card className="hidden lg:flex lg:col-span-3 bg-surface border border-outline shadow-xs flex-col overflow-hidden min-w-0 h-full">
            <CardHeader className="p-4 border-b border-outline bg-background shrink-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface">
                Inquiry Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {renderInspectorContent(selectedInquiry)}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Bottom Drawer for Context Inspector */}
      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DrawerContent className="bg-surface border-t border-outline">
          <DrawerHeader>
            <DrawerTitle>Inquiry Details</DrawerTitle>
            <DrawerDescription>
              {selectedInquiry?.property_title || 'Property & contact details'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {renderInspectorContent(selectedInquiry)}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
