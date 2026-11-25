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
import ChatLiveAgentCarousel from './ChatLiveAgentCarousel';

const PROPERTY_ROUTE_REGEX = /^\/(?:properties|listing)\/([^/?#]+)/i;
const LIVE_SESSION_STORAGE_KEY = 'hsr_live_chat_session';
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
  const [livePanelState, setLivePanelState] = useState('idle');
  const [liveAgents, setLiveAgents] = useState([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [selectedLiveAgent, setSelectedLiveAgent] = useState(null);
  const [offlineNotice, setOfflineNotice] = useState('');
  const [liveConnectionState, setLiveConnectionState] = useState('connected');
  const [liveSession, setLiveSession] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.sessionStorage?.getItem(LIVE_SESSION_STORAGE_KEY) : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
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

  useEffect(() => {
    if (!liveSession?.inquiryId) return;

    let cancelled = false;
    setLiveConnectionState('connected');

    if (typeof chatService.getLiveMessages === 'function') {
      Promise.resolve(
        chatService.getLiveMessages(liveSession.inquiryId, liveSession.liveChatToken)
      )
        .then((res) => {
          if (cancelled || !Array.isArray(res?.messages)) return;
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const incoming = res.messages
              .filter((m) => !existingIds.has(m.id))
              .map((m) => ({
                id: m.id,
                type: m.sender === 'client' ? 'user' : 'ai',
                senderName: m.sender_name,
                text: m.content,
                cards: [],
                comparison: null,
                nearby: null,
                followUpSuggestions: [],
              }));
            return incoming.length ? [...prev, ...incoming] : prev;
          });
        })
        .catch(() => {});
    }

    const unsubscribe =
      typeof chatService.subscribeLiveChat === 'function'
        ? chatService.subscribeLiveChat(liveSession.inquiryId, liveSession.liveChatToken, {
            onMessage: (payload) => {
              if (cancelled || !payload?.message) return;
              const m = payload.message;
              setLiveConnectionState('connected');
              setMessages((prev) => {
                if (prev.some((existing) => existing.id === m.id)) return prev;
                return [
                  ...prev,
                  {
                    id: m.id || createMessageId('live'),
                    type: m.sender === 'client' ? 'user' : 'ai',
                    senderName: m.sender_name,
                    text: m.content,
                    cards: [],
                    comparison: null,
                    nearby: null,
                    followUpSuggestions: [],
                  },
                ];
              });
            },
            onAgentReassigned: (payload) => {
              if (cancelled) return;
              if (payload?.agent) {
                setLiveSession((prev) => {
                  const next = prev ? { ...prev, agent: payload.agent } : prev;
                  try {
                    window.sessionStorage?.setItem(LIVE_SESSION_STORAGE_KEY, JSON.stringify(next));
                  } catch {
                    // ignore
                  }
                  return next;
                });
              }
              if (payload?.message) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: createMessageId('reassign'),
                    type: 'ai',
                    text: payload.message,
                    cards: [],
                    comparison: null,
                    nearby: null,
                    followUpSuggestions: [],
                  },
                ]);
              }
            },
            onFallbackOffline: (payload) => {
              if (cancelled) return;
              setMessages((prev) => [
                ...prev,
                {
                  id: createMessageId('offline'),
                  type: 'ai',
                  text:
                    payload?.message ||
                    'Our agents are currently assisting other clients. Your conversation is saved and an agent will reach out shortly.',
                  cards: [],
                  comparison: null,
                  nearby: null,
                  followUpSuggestions: [],
                },
              ]);
            },
            onError: () => {
              if (!cancelled) setLiveConnectionState('reconnecting');
            },
          })
        : () => {};

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [liveSession?.inquiryId, liveSession?.liveChatToken]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const handleEndLiveChat = () => {
    setLiveSession(null);
    setLivePanelState('idle');
    setShowEscalationForm(false);
    setSelectedLiveAgent(null);
    setOfflineNotice('');
    try {
      window.sessionStorage?.removeItem(LIVE_SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const openHandoff = (property = null) => {
    const normalizedProp = normalizeAttachedProperty(property);
    setAttachedProperty(normalizedProp);
    setOfflineNotice('');
    setSelectedLiveAgent(null);

    if (typeof chatService.getLiveAgents !== 'function') {
      setLivePanelState('handoff_offline');
      setShowEscalationForm(true);
      return;
    }

    const maybePromise = chatService.getLiveAgents({
      propertyId: normalizedProp?.id || activePropertyId || undefined,
      city: normalizedProp?.city,
      propertyType: normalizedProp?.propertyType,
    });

    if (!maybePromise || typeof maybePromise.then !== 'function') {
      setLivePanelState('handoff_offline');
      setShowEscalationForm(true);
      return;
    }

    setLivePanelState('carousel');
    setIsLoadingAgents(true);
    setShowEscalationForm(false);

    maybePromise
      .then((res) => {
        const list = Array.isArray(res?.agents) ? res.agents : [];
        setLiveAgents(list);
        if (list.length === 0) {
          setOfflineNotice('All agents are currently offline. Leave a message and an agent will reply shortly.');
          setLivePanelState('handoff_offline');
          setShowEscalationForm(true);
        }
      })
      .catch(() => {
        setLiveAgents([]);
        setOfflineNotice('');
        setLivePanelState('handoff_offline');
        setShowEscalationForm(true);
      })
      .finally(() => {
        setIsLoadingAgents(false);
      });
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

    if (liveSession?.inquiryId && !textOverride) {
      const requestId = createMessageId('req');
      const userMsg = {
        id: createMessageId('user'),
        type: 'user',
        text: userText,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setIsNearBottom(true);

      try {
        await chatService.sendLiveMessage(
          liveSession.inquiryId,
          userText,
          liveSession.liveChatToken,
          requestId
        );
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId('live-err'),
            type: 'ai',
            text: 'Could not send your message. Please check your connection and try again.',
            cards: [],
            comparison: null,
            nearby: null,
            followUpSuggestions: [],
          },
        ]);
      }
      return;
    }

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
    setActiveStatus('Connecting...');
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
                text: 'The AI Assistant is temporarily unavailable right now. You can still reach an agent by clicking "Talk to an Agent" below.',
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

  const expandedInnerClass = isExpanded ? 'w-full md:max-w-3xl lg:max-w-4xl mx-auto' : 'w-full';
  const expandedPaddingX = isExpanded ? 'px-4 md:px-6 lg:px-8' : 'px-4';

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
                  ? 'sm:fixed sm:inset-0 sm:w-full sm:h-full sm:max-w-none sm:max-h-none sm:mb-0 sm:rounded-none border-0'
                  : 'sm:static sm:w-96 md:w-md sm:max-w-[calc(100vw-2rem)] sm:h-140 sm:max-h-[80vh] sm:mb-4 sm:rounded-xl'
              )}
            >
              {/* Teal Brand Header */}
              <div
                className={cn(
                  'bg-[#0F766E] border-b border-[#115E59] py-4 text-white shrink-0 relative z-10',
                  expandedPaddingX
                )}
              >
                <div className={cn('flex items-center justify-between gap-2', expandedInnerClass)}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <div className="size-10 rounded-full bg-white/15 text-white border border-white/25 flex items-center justify-center">
                        <Bot className="size-5" aria-hidden="true" />
                      </div>
                      <div className="absolute bottom-0 right-0 size-3 bg-emerald-400 border-2 border-[#0F766E] rounded-full motion-safe:animate-pulse" />
                    </div>
                    <div className="flex flex-col items-start gap-1 min-w-0">
                      <h3 className="font-display font-semibold text-sm leading-tight text-white truncate max-w-full">
                        {liveSession
                          ? `Live Chat · ${liveSession.agent?.name || 'Licensed Agent'}`
                          : 'AI Assistant'}
                      </h3>
                      <Badge variant="secondary" className="w-fit bg-[#CCFBF1] text-[#0F766E] border-transparent">
                        {liveSession ? 'Online' : 'Automated'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {liveSession ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleEndLiveChat}
                        className="min-h-11 sm:min-h-9 rounded-lg text-white hover:text-white hover:bg-white/15 text-xs font-semibold"
                      >
                        End Chat
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleNewChat}
                        aria-label="New chat"
                        title="New chat"
                        className="size-11 sm:size-10 rounded-lg text-white/80 hover:text-white hover:bg-white/15"
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsExpanded((prev) => !prev)}
                      aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                      title={isExpanded ? 'Collapse chat' : 'Expand chat'}
                      className="hidden sm:inline-flex size-11 sm:size-10 rounded-lg text-white/80 hover:text-white hover:bg-white/15"
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
                      className="size-11 sm:size-10 rounded-lg text-white/80 hover:text-white hover:bg-white/15"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Listing Context Strip */}
              {currentActiveListing?.title && (
                <div
                  className={cn(
                    'py-2 bg-[#CCFBF1]/40 border-b border-[#0F766E]/20 text-xs text-[#1E293B] shrink-0',
                    expandedPaddingX
                  )}
                >
                  <div className={cn('flex items-center gap-2', expandedInnerClass)}>
                    <MapPin className="size-4 shrink-0 text-[#0F766E]" />
                    <span className="truncate font-medium">
                      Currently viewing: {currentActiveListing.title}
                    </span>
                  </div>
                </div>
              )}

              {/* Messages Canvas (MUST preserve data-lenis-prevent="true") */}
              <div className="relative flex-1 min-h-0 flex flex-col bg-[#F8FAFC]">
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className={cn(
                    'flex-1 min-h-0 overflow-y-auto py-4 flex flex-col custom-scrollbar',
                    expandedPaddingX,
                    messages.length === 0 ? 'justify-center' : ''
                  )}
                  data-lenis-prevent="true"
                >
                  <div
                    className={cn(
                      'flex flex-col',
                      expandedInnerClass,
                      messages.length === 0 ? '' : 'gap-4'
                    )}
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
                            <div
                              className={cn(
                                'px-4 py-2 rounded-xl rounded-tr-sm bg-[#0F766E] text-white font-sans text-sm leading-relaxed shadow-xs break-words',
                                isExpanded ? 'max-w-[85%] md:max-w-[75%]' : 'max-w-[85%]'
                              )}
                            >
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
                                <div
                                  className={cn(
                                    'min-w-0',
                                    isExpanded
                                      ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                                      : 'flex flex-col gap-2'
                                  )}
                                >
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
                                  className="self-start min-h-11 sm:min-h-8 px-4 bg-[#FF8559] text-white hover:bg-[#F07144] hover:text-white font-semibold normal-case tracking-normal text-xs shadow-xs"
                                >
                                  <UserCheck data-icon="inline-start" />
                                  Talk to an Agent
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
                                        className="rounded-full normal-case tracking-normal font-medium text-xs h-auto min-h-11 sm:min-h-8 px-4 py-1 whitespace-normal text-left border-[#E2E8F0] text-[#1E293B] hover:border-[#0F766E] hover:bg-[#CCFBF1]/30 hover:text-[#0F766E]"
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
                </div>

                {!isNearBottom && messages.length > 0 && !showEscalationForm && (
                  <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none z-10">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={scrollToLatest}
                      className="pointer-events-auto min-h-11 sm:min-h-0 rounded-full shadow-md bg-white text-[#1E293B] border-[#E2E8F0] normal-case tracking-normal text-xs"
                    >
                      <ArrowDown data-icon="inline-start" />
                      Jump to latest
                    </Button>
                  </div>
                )}
              </div>

              {/* Live Chat Context Strip */}
              {liveSession && (
                <div
                  className={cn(
                    'py-2 bg-emerald-50/70 border-b border-emerald-200 text-xs text-emerald-800 shrink-0',
                    expandedPaddingX
                  )}
                >
                  <div className={cn('flex items-center justify-between gap-2', expandedInnerClass)}>
                    <span className="truncate font-medium">
                      Connected with {liveSession.agent?.name || 'Licensed Agent'} · Typically replies in under 2 minutes
                    </span>
                  </div>
                </div>
              )}

              {/* Live Reconnect Banner */}
              {liveSession && liveConnectionState === 'reconnecting' && (
                <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 shrink-0">
                  Reconnecting to live chat...
                </div>
              )}

              {/* Carousel -> Handoff Form -> Standard Composer */}
              {livePanelState === 'carousel' && !showEscalationForm ? (
                <motion.div
                  key="live-carousel"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={
                    isExpanded
                      ? 'bg-[#F8FAFC] shrink-0 min-h-0 max-h-full overflow-y-auto'
                      : 'contents'
                  }
                >
                  <div
                    className={
                      isExpanded ? cn(expandedInnerClass, 'md:px-2 lg:px-4') : 'contents'
                    }
                  >
                    <ChatLiveAgentCarousel
                      agents={liveAgents}
                      isLoading={isLoadingAgents}
                      isExpanded={isExpanded}
                      onSelectAgent={(agent) => {
                        setSelectedLiveAgent(agent);
                        setLivePanelState('handoff_live');
                        setShowEscalationForm(true);
                      }}
                      onBestMatch={() => {
                        setSelectedLiveAgent(liveAgents[0] || null);
                        setLivePanelState('handoff_live');
                        setShowEscalationForm(true);
                      }}
                      onLeaveMessage={() => {
                        setSelectedLiveAgent(null);
                        setOfflineNotice('');
                        setLivePanelState('handoff_offline');
                        setShowEscalationForm(true);
                      }}
                      onCancel={() => {
                        setLivePanelState('idle');
                        setAttachedProperty(null);
                      }}
                    />
                  </div>
                </motion.div>
              ) : showEscalationForm ? (
                <motion.div
                  key="handoff-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={
                    isExpanded
                      ? 'bg-[#F8FAFC] shrink-0 min-h-0 max-h-full overflow-y-auto'
                      : 'contents'
                  }
                >
                  <div
                    className={
                      isExpanded ? cn(expandedInnerClass, 'md:px-2 lg:px-4') : 'contents'
                    }
                  >
                    <ChatHandoffForm
                      mode={livePanelState === 'handoff_live' ? 'live' : 'offline'}
                      selectedAgent={selectedLiveAgent}
                      offlineNotice={offlineNotice}
                      attachedProperty={attachedProperty}
                      handoffSummary={latestHandoffSummary}
                      recentMessages={messages}
                      onCancel={() => {
                        setShowEscalationForm(false);
                        setLivePanelState('idle');
                        setSelectedLiveAgent(null);
                        setOfflineNotice('');
                        setAttachedProperty(null);
                      }}
                      onLiveConnected={(sessionData) => {
                        setShowEscalationForm(false);
                        setLivePanelState('idle');
                        setSelectedLiveAgent(null);
                        setAttachedProperty(null);
                        const nextSession = {
                          inquiryId: sessionData.inquiryId,
                          referenceCode: sessionData.referenceCode,
                          agent: sessionData.agent,
                          liveChatToken: sessionData.liveChatToken,
                        };
                        setLiveSession(nextSession);
                        try {
                          window.sessionStorage?.setItem(
                            LIVE_SESSION_STORAGE_KEY,
                            JSON.stringify(nextSession)
                          );
                        } catch {
                          // ignore
                        }
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: createMessageId('live-connected'),
                            type: 'ai',
                            text: sessionData.agent?.name
                              ? `You are now connected with ${sessionData.agent.name} (Ref: ${sessionData.referenceCode || sessionData.inquiryId}).`
                              : `Your live chat request is saved (Ref: ${sessionData.referenceCode || sessionData.inquiryId}).`,
                            cards: [],
                            comparison: null,
                            nearby: null,
                            followUpSuggestions: [],
                          },
                        ]);
                      }}
                      onSuccess={(refId) => {
                        setShowEscalationForm(false);
                        setLivePanelState('idle');
                        setOfflineNotice('');
                        setAttachedProperty(null);
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: createMessageId('handoff'),
                            type: 'ai',
                            text: `Thank you! Your message (${refId}) has been sent to an agent.`,
                            cards: [],
                            comparison: null,
                            nearby: null,
                            followUpSuggestions: [],
                          },
                        ]);
                      }}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="composer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="contents"
                >
                  {/* Sticky + Compare Picker Bar */}
                  {selectedCompare.length > 0 && (
                    <div
                      className={cn(
                        'py-2 bg-[#CCFBF1]/30 border-t border-[#0F766E]/20 shrink-0',
                        expandedPaddingX
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-between gap-2',
                          expandedInnerClass
                        )}
                      >
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
                            className="min-h-11 sm:min-h-0 normal-case tracking-normal text-xs text-[#64748B] hover:text-[#1E293B]"
                          >
                            Clear
                          </Button>
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            disabled={selectedCompare.length < 2 || isStreaming}
                            onClick={handleCompareSelected}
                            className="min-h-11 sm:min-h-0 normal-case tracking-normal text-xs"
                          >
                            <GitCompareArrows data-icon="inline-start" />
                            Compare Selected ({selectedCompare.length})
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rounded Input Composer */}
                  <div
                    className={cn(
                      'py-4 bg-white border-t border-[#E2E8F0] shrink-0 relative z-10',
                      expandedPaddingX
                    )}
                  >
                    <form
                      onSubmit={handleSend}
                      className={cn('flex items-center gap-2', expandedInnerClass)}
                    >
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        maxLength={MAX_CHAT_MESSAGE_LENGTH}
                        aria-label="Message AI Assistant"
                        className="flex-1 bg-[#F8FAFC] border-[#E2E8F0] rounded-full px-4 text-sm text-[#1E293B] placeholder:text-[#64748B] focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
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
                          className="size-11 sm:size-10 rounded-full shrink-0 border-[#E2E8F0] text-[#1E293B] hover:bg-[#F1F5F9]"
                        >
                          <Square className="size-4 fill-current" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={!inputValue.trim()}
                          aria-label="Send message"
                          size="icon"
                          className="size-11 sm:size-10 rounded-full shrink-0 bg-[#0F766E] hover:bg-[#115E59] text-white"
                        >
                          <Send className="size-4" />
                        </Button>
                      )}
                    </form>
                  </div>

                  {/* Slim Footer Strip with Coral Agent CTA */}
                  <div
                    className={cn(
                      'py-2 bg-white border-t border-[#E2E8F0] shrink-0',
                      expandedPaddingX
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-between gap-2',
                        expandedInnerClass
                      )}
                    >
                      <span className="text-xs text-[#64748B] truncate">
                        AI Assistant · Not a licensed broker
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openHandoff(currentActiveListing)}
                        className="min-h-11 sm:min-h-0 shrink-0 normal-case tracking-normal text-xs font-semibold bg-[#FF8559] text-white hover:bg-[#F07144] hover:text-white shadow-xs"
                      >
                        <UserCheck data-icon="inline-start" />
                        Talk to an Agent
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle AI Assistant"
          className="pointer-events-auto bg-[#0F766E] hover:bg-[#115E59] text-white size-14 md:size-16 rounded-full shadow-md flex items-center justify-center relative group border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
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
            <>
              <div className="absolute inset-0 rounded-full border-2 border-white/40 motion-safe:animate-ping opacity-20 group-hover:opacity-40 pointer-events-none" />
              <span
                aria-hidden="true"
                className="absolute top-0 right-0 size-3.5 rounded-full bg-[#FF8559] ring-2 ring-white pointer-events-none"
              />
            </>
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
