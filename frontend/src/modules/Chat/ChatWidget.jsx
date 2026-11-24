import { useState, useEffect, useRef } from 'react';
import { useInRouterContext, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  ArrowDown,
  Bot,
  GitCompareArrows,
  Loader2,
  MapPin,
  Maximize2,
  MessageCircle,
  Minimize2,
  RotateCcw,
  Send,
  Square,
  UserCheck,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trace, TraceLine, TraceIcon, TraceTitle } from '@/components/ui/trace';
import { chatService } from '../../services/chatService';
import { propertyService } from '../../services/propertyService';
import ChatMessageText from './ChatMessageText';
import ChatWelcomeView from './ChatWelcomeView';
import ChatPropertyCard from './ChatPropertyCard';
import ChatComparisonCard from './ChatComparisonCard';
import ChatNearbyCard from './ChatNearbyCard';
import ChatHandoffForm from './ChatHandoffForm';

const PROPERTY_ROUTE_REGEX = /^\/(?:properties|listing)\/([^/?#]+)/i;
const MAX_CHAT_MESSAGE_LENGTH = 2000;
const MAX_COMPARE_SELECTION = 3;
const SCROLL_NEAR_BOTTOM_THRESHOLD = 48;

function extractPropertyId(pathname) {
  if (typeof pathname !== 'string') return null;
  const match = pathname.match(PROPERTY_ROUTE_REGEX);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function normalizeReply(aiResponse) {
  if (typeof aiResponse === 'string') {
    return {
      message: aiResponse,
      cards: [],
      comparison: null,
      nearby: null,
      handoffDraft: null,
      suggestHandoff: false,
      handoffReason: null,
      followUpSuggestions: [],
    };
  }

  return {
    message: typeof aiResponse?.message === 'string' ? aiResponse.message : '',
    cards: Array.isArray(aiResponse?.cards) ? aiResponse.cards : [],
    comparison: aiResponse?.comparison ?? null,
    nearby: aiResponse?.nearby ?? null,
    handoffDraft: aiResponse?.handoffDraft ?? null,
    suggestHandoff: Boolean(aiResponse?.suggestHandoff),
    handoffReason: typeof aiResponse?.handoffReason === 'string' ? aiResponse.handoffReason : null,
    followUpSuggestions: Array.isArray(aiResponse?.followUpSuggestions)
      ? aiResponse.followUpSuggestions
          .filter((item) => typeof item === 'string' && item.trim())
          .map((item) => item.trim())
          .slice(0, 3)
      : [],
  };
}

function createMessageId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeAttachedProperty(property) {
  if (!property) return null;
  const resolvedPrice = property.formattedPrice
    ? String(property.formattedPrice)
    : property.price !== undefined && property.price !== null
      ? String(property.price)
      : undefined;

  return {
    ...property,
    ...(resolvedPrice !== undefined ? { price: resolvedPrice } : {}),
  };
}

function getPreferredScrollBehavior() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  return prefersReducedMotion ? 'auto' : 'smooth';
}

function finalizeStreamingMessage(prevMessages, targetId = null) {
  return prevMessages.reduce((acc, msg) => {
    const shouldFinalize = targetId ? msg.id === targetId && msg.isStreaming : msg.isStreaming;
    if (!shouldFinalize) {
      acc.push(msg);
      return acc;
    }
    if (typeof msg.text === 'string' && msg.text.trim().length > 0) {
      acc.push({ ...msg, isStreaming: false });
    }
    return acc;
  }, []);
}

function ChatWidgetContent({ pathname, onNavigateProperty }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeStatus, setActiveStatus] = useState('');
  const [selectedCompare, setSelectedCompare] = useState([]);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [attachedProperty, setAttachedProperty] = useState(null);
  const [latestHandoffSummary, setLatestHandoffSummary] = useState('');
  const [activeListing, setActiveListing] = useState(null);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const activeStreamMsgIdRef = useRef(null);

  const activePropertyId = extractPropertyId(pathname);
  const currentActiveListing =
    activePropertyId && activeListing?.routePropertyId === activePropertyId ? activeListing : null;

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!activePropertyId) {
      setActiveListing(null);
      return;
    }
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    propertyService
      .getPropertyById(activePropertyId, { publicView: 'true' })
      .then((listing) => {
        if (cancelled) return;
        if (listing?.title) {
          setActiveListing({
            ...listing,
            id: listing.id || activePropertyId,
            routePropertyId: activePropertyId,
          });
        } else {
          setActiveListing(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setActiveListing(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activePropertyId, isOpen]);

  useEffect(() => {
    if (!isOpen || !isNearBottom) return;
    if (isStreaming) {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      return;
    }
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: getPreferredScrollBehavior(),
      });
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen, messages, isStreaming, activeStatus, isNearBottom]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const openHandoff = (property = null) => {
    setAttachedProperty(normalizeAttachedProperty(property));
    setShowEscalationForm(true);
  };

  const handleNewChat = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    activeStreamMsgIdRef.current = null;
    setMessages([]);
    setInputValue('');
    setIsStreaming(false);
    setActiveStatus('');
    setSelectedCompare([]);
    setShowEscalationForm(false);
    setAttachedProperty(null);
    setLatestHandoffSummary('');
    setIsNearBottom(true);
  };

  const handleStop = () => {
    const targetId = activeStreamMsgIdRef.current;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    activeStreamMsgIdRef.current = null;
    setIsStreaming(false);
    setActiveStatus('');
    setMessages((prev) => finalizeStreamingMessage(prev, targetId));
  };

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setIsNearBottom(distanceFromBottom <= SCROLL_NEAR_BOTTOM_THRESHOLD);
  };

  const scrollToLatest = () => {
    setIsNearBottom(true);
    messagesEndRef.current?.scrollIntoView({
      behavior: getPreferredScrollBehavior(),
    });
  };

  const handleToggleCompare = (property) => {
    if (!property?.id) return;
    setSelectedCompare((prev) => {
      const exists = prev.some((item) => item.id === property.id);
      if (exists) {
        return prev.filter((item) => item.id !== property.id);
      }
      if (prev.length >= MAX_COMPARE_SELECTION) {
        return prev;
      }
      return [...prev, { id: property.id, title: property.title || property.id }];
    });
  };

  const handleCompareSelected = () => {
    if (selectedCompare.length < 2 || isStreaming) return;
    const summaryList = selectedCompare
      .map((prop) => `${prop.title} (ID: ${prop.id})`)
      .join(', ');
    setSelectedCompare([]);
    handleSend(null, `Compare these properties side by side: ${summaryList}`);
  };

  const handleSend = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const rawText = textOverride ?? inputValue;
    const userText =
      typeof rawText === 'string' ? rawText.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH) : '';
    if (!userText || isStreaming) return;

    const userMsg = {
      id: createMessageId('user'),
      type: 'user',
      text: userText,
    };
    const aiMsgId = createMessageId('ai');
    const aiPlaceholder = {
      id: aiMsgId,
      type: 'ai',
      text: '',
      cards: [],
      comparison: null,
      nearby: null,
      suggestHandoff: false,
      handoffReason: null,
      followUpSuggestions: [],
      isStreaming: true,
    };

    const apiMessages = [...messages, userMsg]
      .map((msg) => ({
        role: msg.type === 'ai' ? 'assistant' : 'user',
        content:
          typeof msg.text === 'string'
            ? msg.text.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH)
            : '',
      }))
      .filter((msg) => msg.content.length > 0)
      .slice(-20);

    const pageContext = activePropertyId
      ? { route: pathname, propertyId: activePropertyId }
      : { route: pathname };

    const controller = new AbortController();
    abortControllerRef.current = controller;
    activeStreamMsgIdRef.current = aiMsgId;

    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
    setInputValue('');
    setIsStreaming(true);
    setActiveStatus('Connecting to AI Concierge...');
    setIsNearBottom(true);

    let resultApplied = false;

    const applyFinalResult = (rawResponse) => {
      if (abortControllerRef.current !== controller) return;
      resultApplied = true;
      const normalized = normalizeReply(rawResponse);

      if (
        typeof normalized.handoffDraft?.summary === 'string' &&
        normalized.handoffDraft.summary.trim()
      ) {
        setLatestHandoffSummary(normalized.handoffDraft.summary.trim());
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: normalized.message || msg.text,
                cards: normalized.cards,
                comparison: normalized.comparison,
                nearby: normalized.nearby,
                suggestHandoff: normalized.suggestHandoff,
                handoffReason: normalized.handoffReason,
                followUpSuggestions: normalized.followUpSuggestions,
                isStreaming: false,
              }
            : msg
        )
      );
    };

    try {
      const finalResponse = await chatService.streamMessage(apiMessages, pageContext, {
        signal: controller.signal,
        onStatus: (statusEvent) => {
          if (abortControllerRef.current !== controller) return;
          const label = typeof statusEvent === 'string' ? statusEvent : statusEvent?.label;
          if (typeof label === 'string' && label.trim()) {
            setActiveStatus(label.trim());
          }
        },
        onDelta: (chunk) => {
          if (abortControllerRef.current !== controller || typeof chunk !== 'string' || !chunk) {
            return;
          }
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId ? { ...msg, text: `${msg.text}${chunk}` } : msg
            )
          );
        },
        onResult: (payload) => {
          applyFinalResult(payload);
        },
      });

      if (!resultApplied && finalResponse !== undefined) {
        applyFinalResult(finalResponse);
      }
    } catch (error) {
      if (error?.name === 'AbortError' || controller.signal.aborted) {
        setMessages((prev) => finalizeStreamingMessage(prev, aiMsgId));
        return;
      }

      if (abortControllerRef.current !== controller) {
        return;
      }

      console.error('Chat error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: 'The AI Property Concierge is temporarily unavailable right now. You can still reach a licensed agent by clicking "Talk to a Licensed Agent" below.',
                cards: [],
                comparison: null,
                nearby: null,
                suggestHandoff: false,
                handoffReason: null,
                followUpSuggestions: [],
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        activeStreamMsgIdRef.current = null;
        setIsStreaming(false);
        setActiveStatus('');
      }
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-end pointer-events-none"
        id="ai-chat"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              data-testid="chat-widget-panel"
              initial={{ opacity: 0, scale: 0.96, y: 16, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className={cn(
                'fixed inset-0 z-10 w-full h-full rounded-none bg-white shadow-xl overflow-hidden border border-[#E2E8F0] flex flex-col pointer-events-auto',
                isExpanded
                  ? 'sm:fixed sm:inset-y-4 sm:right-4 sm:inset-x-auto sm:w-xl sm:max-w-[calc(100vw-2rem)] sm:h-auto sm:max-h-none sm:mb-0 sm:rounded-xl'
                  : 'sm:static sm:w-96 md:w-md sm:max-w-[calc(100vw-2rem)] sm:h-140 sm:max-h-[80vh] sm:mb-4 sm:rounded-xl'
              )}
            >
              {/* Crisp White Architectural Header */}
              <div className="bg-white border-b border-[#E2E8F0] p-4 flex items-center justify-between gap-2 text-[#1E293B] shrink-0 relative z-10">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    <div className="size-10 rounded-full bg-[#0F766E] text-white flex items-center justify-center">
                      <Bot className="size-5" aria-hidden="true" />
                    </div>
                    <div className="absolute bottom-0 right-0 size-3 bg-emerald-500 border-2 border-white rounded-full motion-safe:animate-pulse" />
                  </div>
                  <div className="flex flex-col items-start gap-1 min-w-0">
                    <h3 className="font-display font-semibold text-sm leading-tight text-[#1E293B] truncate max-w-full">
                      AI Property Concierge
                    </h3>
                    <Badge variant="secondary" className="w-fit">
                      RA 9646
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleNewChat}
                    aria-label="New chat"
                    title="New chat"
                    className="size-10 rounded-lg text-[#64748B] hover:text-[#1E293B]"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                    title={isExpanded ? 'Collapse chat' : 'Expand chat'}
                    className="hidden sm:inline-flex size-10 rounded-lg text-[#64748B] hover:text-[#1E293B]"
                  >
                    {isExpanded ? (
                      <Minimize2 className="size-4" />
                    ) : (
                      <Maximize2 className="size-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleChat}
                    aria-label="Close chat"
                    title="Close chat"
                    className="size-10 rounded-lg text-[#64748B] hover:text-[#1E293B]"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Active Listing Context Strip */}
              {currentActiveListing?.title && (
                <div className="px-4 py-2 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center gap-2 text-xs text-[#1E293B] shrink-0">
                  <MapPin className="size-4 shrink-0 text-[#0F766E]" />
                  <span className="truncate font-medium">
                    Currently viewing: {currentActiveListing.title}
                  </span>
                </div>
              )}

              {/* Messages Canvas (MUST preserve data-lenis-prevent="true") */}
              <div className="relative flex-1 min-h-0 flex flex-col bg-[#F8FAFC]">
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar"
                  data-lenis-prevent="true"
                >
                  {messages.length === 0 ? (
                    <ChatWelcomeView
                      activeListing={currentActiveListing}
                      onSelectPrompt={(prompt) => handleSend(null, prompt)}
                      onAskAgent={(prop) => openHandoff(prop)}
                    />
                  ) : (
                    messages.map((msg, idx) => {
                      const hasVisibleAiContent =
                        Boolean(msg.text && msg.text.trim()) ||
                        (msg.isStreaming && Boolean(activeStatus)) ||
                        (Array.isArray(msg.cards) && msg.cards.length > 0) ||
                        Boolean(msg.comparison) ||
                        Boolean(msg.nearby) ||
                        Boolean(msg.suggestHandoff);

                      if (msg.type === 'ai' && !hasVisibleAiContent) {
                        return null;
                      }

                      const isLatestFinalizedAi =
                        !isStreaming &&
                        msg.type === 'ai' &&
                        !msg.isStreaming &&
                        idx === messages.length - 1;

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={msg.id}
                          className={cn(
                            'flex gap-2',
                            msg.type === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {msg.type === 'ai' && (
                            <div className="size-8 rounded-full bg-[#CCFBF1] flex items-center justify-center shrink-0 mt-1 border border-[#0F766E]/20">
                              <Bot className="size-4 text-[#0F766E]" aria-hidden="true" />
                            </div>
                          )}

                          {msg.type === 'user' ? (
                            <div className="px-4 py-2 rounded-xl rounded-tr-sm max-w-[85%] bg-[#0F766E] text-white font-sans text-sm leading-relaxed shadow-xs break-words">
                              {msg.text}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 flex-1 min-w-0 max-w-[85%]">
                              {msg.isStreaming && activeStatus && (
                                <div
                                  role="status"
                                  aria-live="polite"
                                  className="px-4 py-2 rounded-xl rounded-tl-sm bg-white border border-[#E2E8F0] shadow-xs"
                                >
                                  <Trace>
                                    <TraceLine status="running">
                                      <TraceIcon>
                                        <Loader2 className="motion-safe:animate-spin text-[#0F766E]" />
                                      </TraceIcon>
                                      <TraceTitle className="text-xs text-[#64748B]">
                                        {activeStatus}
                                      </TraceTitle>
                                    </TraceLine>
                                  </Trace>
                                </div>
                              )}

                              {msg.text && msg.text.trim() && (
                                <div className="px-4 py-2 rounded-xl rounded-tl-sm bg-white text-[#1E293B] border border-[#E2E8F0] font-sans text-sm leading-relaxed shadow-xs break-words">
                                  <ChatMessageText text={msg.text} />
                                </div>
                              )}

                              {Array.isArray(msg.cards) && msg.cards.length > 0 && (
                                <div className="flex flex-col gap-2 min-w-0">
                                  {msg.cards.map((prop) => (
                                    <ChatPropertyCard
                                      key={prop.id}
                                      property={prop}
                                      onAskAgent={(selected) => openHandoff(selected)}
                                      onNavigate={onNavigateProperty}
                                      isSelectedForCompare={selectedCompare.some(
                                        (item) => item.id === prop.id
                                      )}
                                      compareDisabled={
                                        selectedCompare.length >= MAX_COMPARE_SELECTION
                                      }
                                      onToggleCompare={handleToggleCompare}
                                    />
                                  ))}
                                </div>
                              )}

                              {msg.comparison && (
                                <ChatComparisonCard
                                  comparison={msg.comparison}
                                  onAskAgent={(selected) => openHandoff(selected)}
                                />
                              )}

                              {msg.nearby && <ChatNearbyCard nearby={msg.nearby} />}

                              {msg.suggestHandoff && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    openHandoff(msg.cards?.[0] ?? currentActiveListing ?? null)
                                  }
                                  className="self-start min-h-10 px-4 bg-[#FF6B6B] text-[#1E293B] hover:bg-[#EE5A5A] hover:text-[#1E293B] font-semibold normal-case tracking-normal text-xs shadow-xs"
                                >
                                  <UserCheck data-icon="inline-start" />
                                  Connect to Licensed Agent
                                </Button>
                              )}

                              {isLatestFinalizedAi &&
                                Array.isArray(msg.followUpSuggestions) &&
                                msg.followUpSuggestions.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {msg.followUpSuggestions.map((chip) => (
                                      <Button
                                        key={chip}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSend(null, chip)}
                                        className="rounded-full normal-case tracking-normal font-medium text-xs h-auto min-h-8 px-4 py-1 whitespace-normal text-left border-[#E2E8F0] text-[#1E293B] hover:border-[#0F766E] hover:text-[#0F766E]"
                                      >
                                        {chip}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {!isNearBottom && messages.length > 0 && !showEscalationForm && (
                  <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none z-10">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={scrollToLatest}
                      className="pointer-events-auto rounded-full shadow-md bg-white text-[#1E293B] border-[#E2E8F0] normal-case tracking-normal text-xs"
                    >
                      <ArrowDown data-icon="inline-start" />
                      Jump to latest
                    </Button>
                  </div>
                )}
              </div>

              {/* Handoff Form or Compare Bar + Composer + Calm Footer */}
              {showEscalationForm ? (
                <ChatHandoffForm
                  attachedProperty={attachedProperty}
                  handoffSummary={latestHandoffSummary}
                  recentMessages={messages}
                  onCancel={() => {
                    setShowEscalationForm(false);
                    setAttachedProperty(null);
                  }}
                  onSuccess={(refId) => {
                    setShowEscalationForm(false);
                    setAttachedProperty(null);
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: createMessageId('handoff'),
                        type: 'ai',
                        text: `Thank you! Your inquiry (${refId}) has been routed to a PRC-licensed agent.`,
                        cards: [],
                        comparison: null,
                        nearby: null,
                        followUpSuggestions: [],
                      },
                    ]);
                  }}
                />
              ) : (
                <>
                  {/* Sticky + Compare Picker Bar */}
                  {selectedCompare.length > 0 && (
                    <div className="px-4 py-2 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="default" className="shrink-0">
                          {selectedCompare.length} selected
                        </Badge>
                        <span className="text-xs text-[#64748B] truncate">
                          {selectedCompare.length < 2
                            ? 'Select 1 more to compare'
                            : 'Ready to compare'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCompare([])}
                          className="normal-case tracking-normal text-xs text-[#64748B] hover:text-[#1E293B]"
                        >
                          Clear
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          disabled={selectedCompare.length < 2 || isStreaming}
                          onClick={handleCompareSelected}
                          className="normal-case tracking-normal text-xs"
                        >
                          <GitCompareArrows data-icon="inline-start" />
                          Compare Selected ({selectedCompare.length})
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Rounded Input Composer */}
                  <div className="p-4 bg-white border-t border-[#E2E8F0] shrink-0 relative z-10">
                    <form onSubmit={handleSend} className="flex items-center gap-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        maxLength={MAX_CHAT_MESSAGE_LENGTH}
                        aria-label="Message AI Property Concierge"
                        className="flex-1 bg-[#F8FAFC] border-[#E2E8F0] rounded-full px-4 text-sm text-[#1E293B] placeholder:text-[#64748B]"
                        placeholder="Ask about homes, prices, or areas..."
                        type="text"
                      />
                      {isStreaming ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleStop}
                          aria-label="Stop generating"
                          className="size-10 rounded-full shrink-0 border-[#E2E8F0] text-[#1E293B] hover:bg-[#F1F5F9]"
                        >
                          <Square className="size-4 fill-current" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={!inputValue.trim()}
                          aria-label="Send message"
                          size="icon"
                          className="size-10 rounded-full shrink-0"
                        >
                          <Send className="size-4" />
                        </Button>
                      )}
                    </form>
                  </div>

                  {/* Slim Calm Footer Strip */}
                  <div className="px-4 py-2 bg-white border-t border-[#E2E8F0] flex items-center justify-between gap-2 shrink-0">
                    <span className="text-xs text-[#64748B] truncate">
                      AI Concierge · Not a PRC broker
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openHandoff(currentActiveListing)}
                      className="shrink-0 normal-case tracking-normal text-xs font-medium text-[#0F766E] hover:bg-[#CCFBF1]/40 hover:text-[#115E59]"
                    >
                      <UserCheck data-icon="inline-start" />
                      Talk to a Licensed Agent
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle AI Property Concierge"
          className="pointer-events-auto bg-[#0F766E] hover:bg-[#115E59] text-white size-14 md:size-16 rounded-full shadow-md flex items-center justify-center relative group overflow-hidden border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
          onClick={toggleChat}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="size-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="size-6" />
              </motion.div>
            )}
          </AnimatePresence>

          {!isOpen && (
            <div className="absolute inset-0 rounded-full border-2 border-white/40 motion-safe:animate-ping opacity-20 group-hover:opacity-40" />
          )}
        </motion.button>
      </div>
    </MotionConfig>
  );
}

function ChatWidgetWithRouter() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <ChatWidgetContent
      pathname={location.pathname}
      onNavigateProperty={(prop) => {
        if (prop?.id) {
          navigate(`/properties/${prop.id}`);
        }
      }}
    />
  );
}

export default function ChatWidget() {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return <ChatWidgetWithRouter />;
  }
  return <ChatWidgetContent pathname="/" onNavigateProperty={undefined} />;
}
