import { useState, useEffect, useRef } from 'react';
import { useInRouterContext, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Bot, MapPin, MessageCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatService } from '../../services/chatService';
import { propertyService } from '../../services/propertyService';
import ChatPropertyCard from './ChatPropertyCard';
import ChatComparisonCard from './ChatComparisonCard';
import ChatNearbyCard from './ChatNearbyCard';
import ChatHandoffForm from './ChatHandoffForm';

const PROPERTY_ROUTE_REGEX = /^\/properties\/([^/?#]+)/i;

const INITIAL_GREETING = {
  id: 'welcome-ra-9646',
  type: 'ai',
  text: "I am Human Shelter Realty's AI Property Concierge (not a PRC-licensed broker). How can I help you explore our published properties today?",
  cards: [],
  comparison: null,
  nearby: null,
};

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
    };
  }

  return {
    message: typeof aiResponse?.message === 'string' ? aiResponse.message : '',
    cards: Array.isArray(aiResponse?.cards) ? aiResponse.cards : [],
    comparison: aiResponse?.comparison ?? null,
    nearby: aiResponse?.nearby ?? null,
    handoffDraft: aiResponse?.handoffDraft ?? null,
  };
}

function createMessageId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function ChatWidgetContent({ pathname, onNavigateProperty }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_GREETING]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [attachedProperty, setAttachedProperty] = useState(null);
  const [latestHandoffSummary, setLatestHandoffSummary] = useState('');
  const [activeListing, setActiveListing] = useState(null);
  const messagesEndRef = useRef(null);

  const activePropertyId = extractPropertyId(pathname);
  const currentActiveListing =
    activePropertyId && activeListing?.id === activePropertyId ? activeListing : null;

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
      .getPropertyById(activePropertyId)
      .then((listing) => {
        if (cancelled) return;
        if (listing?.title) {
          const numericPrice =
            typeof listing.price === 'number'
              ? listing.price
              : typeof listing.price_raw === 'number' && listing.price_raw > 0
                ? listing.price_raw
                : undefined;

          setActiveListing({
            ...listing,
            id: listing.id || activePropertyId,
            ...(numericPrice !== undefined ? { price: numericPrice } : {}),
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

  const toggleChat = () => setIsOpen((prev) => !prev);

  const openHandoff = (property = null) => {
    setAttachedProperty(property);
    setShowEscalationForm(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, messages, isTyping]);

  const handleSend = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const rawText = textOverride ?? inputValue;
    const userText = typeof rawText === 'string' ? rawText.trim() : '';
    if (!userText || isTyping) return;

    const newMsg = {
      id: createMessageId('user'),
      type: 'user',
      text: userText,
    };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const apiMessages = updatedMessages.map((msg) => ({
        role: msg.type === 'ai' ? 'assistant' : 'user',
        content: msg.text,
      }));

      const pageContext = activePropertyId
        ? { route: pathname, propertyId: activePropertyId }
        : { route: pathname };

      const aiResponse = await chatService.sendMessage(apiMessages, pageContext);
      const normalized = normalizeReply(aiResponse);

      if (
        typeof normalized.handoffDraft?.summary === 'string' &&
        normalized.handoffDraft.summary.trim()
      ) {
        setLatestHandoffSummary(normalized.handoffDraft.summary.trim());
      }

      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId('ai'),
          type: 'ai',
          text: normalized.message,
          cards: normalized.cards,
          comparison: normalized.comparison,
          nearby: normalized.nearby,
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId('err'),
          type: 'ai',
          text: 'The AI Property Concierge is temporarily unavailable right now. You can still reach a licensed agent by clicking "Connect to Agent" below.',
          cards: [],
          comparison: null,
          nearby: null,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = activePropertyId
    ? [
        { label: "What's nearby?", isAgent: false },
        { label: 'Compare similar', isAgent: false },
        { label: 'Ask Agent', isAgent: true },
      ]
    : [
        { label: 'Search by budget', isAgent: false },
        { label: 'Featured homes', isAgent: false },
        { label: 'Connect to Agent', isAgent: true },
      ];

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-end pointer-events-none"
        id="ai-chat"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-96 md:w-md max-w-[calc(100vw-2rem)] h-136 max-h-[75vh] mb-4 bg-white shadow-xl rounded-xl overflow-hidden border border-[#E2E8F0] flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="bg-[#0F766E] p-4 flex justify-between items-center gap-2 text-white shrink-0 relative z-10">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <div className="size-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                      <Bot className="size-5 text-white" />
                    </div>
                    <div className="absolute bottom-0 right-0 size-3 bg-emerald-400 border-2 border-[#0F766E] rounded-full motion-safe:animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="font-display font-bold text-sm leading-tight tracking-wide truncate">
                      AI Property Concierge
                    </h3>
                    <p className="text-xs font-sans text-white/90 uppercase tracking-wider truncate">
                      Automated Assistant · RA 9646
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleChat}
                  aria-label="Close chat"
                  className="size-8 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white focus-visible:ring-white shrink-0"
                >
                  <X className="size-4" />
                </Button>
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

              {/* Messages Area (MUST preserve data-lenis-prevent="true") */}
              <div
                className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC] flex flex-col gap-4 custom-scrollbar"
                data-lenis-prevent="true"
              >
                {messages.map((msg) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                  >
                    {msg.type === 'ai' && (
                      <div className="size-8 rounded-full bg-[#CCFBF1] flex items-center justify-center shrink-0 mt-1 border border-[#0F766E]/20">
                        <Bot className="size-4 text-[#0F766E]" />
                      </div>
                    )}

                    {msg.type === 'user' ? (
                      <div className="px-4 py-2 rounded-xl rounded-tr-sm max-w-[85%] bg-[#0F766E] text-white font-sans text-sm leading-relaxed shadow-xs break-words">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 flex-1 min-w-0 max-w-[85%]">
                        {msg.text && (
                          <div className="px-4 py-2 rounded-xl rounded-tl-sm bg-white text-[#1E293B] border border-[#E2E8F0] font-sans text-sm leading-relaxed shadow-xs break-words">
                            {msg.text}
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
                      </div>
                    )}
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-start gap-2"
                  >
                    <div className="size-8 rounded-full bg-[#CCFBF1] flex items-center justify-center shrink-0 mt-1 border border-[#0F766E]/20">
                      <Bot className="size-4 text-[#0F766E]" />
                    </div>
                    <div className="px-4 py-2 rounded-xl rounded-tl-sm bg-white border border-[#E2E8F0] shadow-xs flex items-center gap-2 h-10">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                        className="size-2 bg-[#0F766E]/60 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }}
                        className="size-2 bg-[#0F766E]/60 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }}
                        className="size-2 bg-[#0F766E]/60 rounded-full"
                      />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Handoff Form or Quick Actions + Composer */}
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
                      },
                    ]);
                  }}
                />
              ) : (
                <>
                  {/* Adaptive Quick Actions */}
                  <div className="px-4 py-2 bg-white border-t border-[#E2E8F0] grid grid-cols-3 gap-2 shrink-0">
                    {quickActions.map((action) => (
                      <Button
                        key={action.label}
                        type="button"
                        variant={action.isAgent ? 'ghost' : 'outline'}
                        size="sm"
                        onClick={() =>
                          action.isAgent
                            ? openHandoff(activePropertyId ? currentActiveListing : null)
                            : handleSend(null, action.label)
                        }
                        className={
                          action.isAgent
                            ? 'w-full h-auto min-h-10 px-2 py-2 rounded-lg bg-[#FF6B6B] text-[#1E293B] hover:bg-[#EE5A5A] text-xs font-semibold normal-case tracking-normal whitespace-normal text-center leading-tight'
                            : 'w-full h-auto min-h-10 px-2 py-2 rounded-lg border-[#0F766E]/30 text-[#0F766E] hover:bg-[#0F766E] hover:text-white text-xs font-semibold normal-case tracking-normal whitespace-normal text-center leading-tight'
                        }
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-white border-t border-[#E2E8F0] shrink-0 relative z-10">
                    <form onSubmit={handleSend} className="flex items-center gap-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-1 bg-[#F8FAFC] border-[#E2E8F0] rounded-full px-4 text-sm text-[#1E293B] placeholder:text-[#64748B]"
                        placeholder="Type your message..."
                        type="text"
                      />
                      <Button
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        aria-label="Send message"
                        size="icon"
                        className="size-10 rounded-full shrink-0"
                      >
                        <Send className="size-4" />
                      </Button>
                    </form>
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
