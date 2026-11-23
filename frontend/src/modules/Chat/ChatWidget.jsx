import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMessageCircle2, IconX, IconSend, IconRobot } from '@tabler/icons-react';

import { chatService } from '../../services/chatService';

import apiClient from '../../services/apiClient';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: "I am Human Shelter Realty's AI Property Concierge (not a PRC-licensed broker). How can I help you explore our published properties today?",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [escalationForm, setEscalationForm] = useState({
    name: '',
    email: '',
    phone: '',
    consentAccepted: false,
  });
  const [escalationStatus, setEscalationStatus] = useState('idle');
  const [escalationError, setEscalationError] = useState('');
  const messagesEndRef = useRef(null);

  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    if (!escalationForm.consentAccepted) {
      setEscalationError('Please accept the Data Privacy Act (RA 10173) notice to continue.');
      return;
    }
    setEscalationStatus('submitting');
    setEscalationError('');
    try {
      const recentContext = messages
        .slice(-4)
        .map((m) => `${m.type === 'user' ? 'Visitor' : 'AI'}: ${m.text}`)
        .join('\n');
      const res = await apiClient.post('/inquiries', {
        name: escalationForm.name.trim(),
        email: escalationForm.email.trim(),
        phone: escalationForm.phone.trim() || undefined,
        message: recentContext || 'Visitor requested a licensed agent via AI Concierge.',
        source: 'ai_chatbot',
        preferredReplyChannel: 'chat',
        consentAccepted: true,
      });
      const refId = res?.data?.data?.id || res?.data?.id || 'submitted';
      setEscalationStatus('success');
      setShowEscalationForm(false);
      setEscalationForm({ name: '', email: '', phone: '', consentAccepted: false });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'ai',
          text: `Thank you! Your inquiry (${refId}) has been routed to a PRC-licensed agent.`,
        },
      ]);
    } catch (err) {
      setEscalationStatus('error');
      setEscalationError(
        err?.response?.data?.error || 'Could not submit your inquiry. Please check your details.'
      );
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const userText = textOverride || inputValue;
    if (!userText.trim()) return;

    const newMsg = { id: Date.now(), type: 'user', text: userText };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      // Map messages to the format expected by the backend
      const apiMessages = updatedMessages.map(msg => ({
        role: msg.type === 'ai' ? 'assistant' : 'user',
        content: msg.text
      }));

      // Call the backend service (which calls Grok API)
      const aiResponseText = await chatService.sendMessage(apiMessages);

      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        text: aiResponseText
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        text: "I apologize, but I am currently experiencing technical difficulties. Please try again later."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[60] flex flex-col items-end pointer-events-none" id="ai-chat">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-[380px] md:w-[440px] mb-4 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] rounded-2xl overflow-hidden border border-[#E2E8F0] flex flex-col pointer-events-auto"
            style={{ height: '550px', maxHeight: '75vh' }}
          >
            {/* Header */}
            <div className="bg-[#0F766E] p-4 flex justify-between items-center text-white shrink-0 shadow-sm relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-inner">
                    <IconRobot size={22} className="text-white drop-shadow-md" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#4ADE80] border-2 border-[#0F766E] rounded-full animate-pulse shadow-sm"></div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-[15px] leading-tight tracking-wide">AI Property Concierge</h3>
                  <p className="text-[10px] font-sans text-white/85 uppercase tracking-widest mt-0.5">Automated Assistant · RA 9646</p>
                </div>
              </div>
              <button 
                onClick={toggleChat}
                aria-label="Close chat"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-transparent hover:border-white/20"
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Messages Area (MUST have data-lenis-prevent="true"!) */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#F9F9F8] space-y-4 custom-scrollbar" data-lenis-prevent="true">
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                >
                  {msg.type === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-[#174849]/10 flex items-center justify-center shrink-0 mt-1 border border-[#174849]/20 shadow-sm">
                      <IconRobot size={14} className="text-[#174849]" />
                    </div>
                  )}
                  <div 
                    className={`p-3.5 rounded-2xl max-w-[80%] font-sans text-[13px] leading-relaxed shadow-sm ${
                      msg.type === 'user' 
                        ? 'bg-[#266F71] text-white rounded-tr-sm' 
                        : 'bg-white text-[#1B1C1A] border border-[#E5E7EB] rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start gap-2"
                >
                  <div className="w-7 h-7 rounded-full bg-[#174849]/10 flex items-center justify-center shrink-0 mt-1 border border-[#174849]/20 shadow-sm">
                    <IconRobot size={14} className="text-[#174849]" />
                  </div>
                  <div className="px-4 py-3.5 rounded-2xl bg-white border border-[#E5E7EB] rounded-tl-sm shadow-sm flex items-center gap-1.5 h-[46px]">
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="w-1.5 h-1.5 bg-[#266F71]/60 rounded-full" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }} className="w-1.5 h-1.5 bg-[#266F71]/60 rounded-full" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }} className="w-1.5 h-1.5 bg-[#266F71]/60 rounded-full" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Escalation Form or Quick Selectors */}
            {showEscalationForm ? (
              <form
                onSubmit={handleEscalateSubmit}
                className="px-4 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] space-y-2 shrink-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1E293B]">
                    Connect to Licensed Agent
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEscalationForm(false)}
                    className="text-xs text-[#64748B] hover:text-[#1E293B]"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={escalationForm.name}
                  onChange={(e) =>
                    setEscalationForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:border-[#0F766E] outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    value={escalationForm.email}
                    onChange={(e) =>
                      setEscalationForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:border-[#0F766E] outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={escalationForm.phone}
                    onChange={(e) =>
                      setEscalationForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:border-[#0F766E] outline-none"
                  />
                </div>
                <label className="flex items-start gap-2 text-[11px] text-[#64748B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={escalationForm.consentAccepted}
                    onChange={(e) =>
                      setEscalationForm((f) => ({
                        ...f,
                        consentAccepted: e.target.checked,
                      }))
                    }
                    className="mt-0.5 accent-[#0F766E]"
                  />
                  <span>
                    I consent to Human Shelter Realty processing my contact details under the Data Privacy Act (RA 10173) so a licensed agent can respond.
                  </span>
                </label>
                {escalationError && (
                  <p className="text-[11px] text-red-600">{escalationError}</p>
                )}
                <button
                  type="submit"
                  disabled={!escalationForm.consentAccepted || escalationStatus === 'submitting'}
                  className="w-full py-2 rounded-lg bg-[#FF6B6B] text-[#1E293B] font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  {escalationStatus === 'submitting' ? 'Sending...' : 'Request Licensed Agent'}
                </button>
              </form>
            ) : (
              <>
                {/* Quick Selectors */}
                <div className="px-4 py-2.5 bg-white border-t border-[#E2E8F0] grid grid-cols-3 gap-1.5 shrink-0">
                  {['Show Penthouses', 'Price of Forbes', 'Contact Agent'].map((suggestion) => (
                    <button 
                      key={suggestion}
                      onClick={() =>
                        suggestion === 'Contact Agent'
                          ? setShowEscalationForm(true)
                          : handleSend(null, suggestion)
                      }
                      className={
                        suggestion === 'Contact Agent'
                          ? 'w-full h-full px-1 py-1.5 rounded-lg bg-[#FF6B6B] text-[#1E293B] text-[9.5px] font-sans font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm flex items-center justify-center text-center leading-tight'
                          : 'w-full h-full px-1 py-1.5 rounded-lg border border-[#0F766E]/30 text-[#0F766E] text-[9.5px] font-sans font-bold uppercase tracking-widest hover:bg-[#0F766E] hover:text-white transition-all shadow-sm flex items-center justify-center text-center leading-tight'
                      }
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-[#E2E8F0] shrink-0 relative z-10">
                  <form onSubmit={handleSend} className="flex gap-2 relative">
                    <input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] rounded-full text-sm font-sans pl-5 pr-12 py-3 outline-none transition-all text-[#1E293B] placeholder:text-[#64748B]"
                      placeholder="Type your message..."
                      type="text"
                    />
                    <button 
                      type="submit"
                      disabled={!inputValue.trim()}
                      aria-label="Send message"
                      className="absolute right-1.5 top-1.5 bottom-1.5 w-9 bg-[#0F766E] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center hover:bg-[#115E59] transition-colors shadow-sm"
                    >
                      <IconSend size={16} className="ml-0.5" />
                    </button>
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
        className="pointer-events-auto bg-[#0F766E] hover:bg-[#115E59] text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-[0_8px_20px_rgba(15,118,110,0.35)] flex items-center justify-center relative group overflow-hidden border border-white/20"
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
              <IconX size={28} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <IconMessageCircle2 size={30} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pulse Ring effect */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping opacity-20 group-hover:opacity-40" style={{ animationDuration: '3s' }}></div>
        )}
      </motion.button>
    </div>
  );
}
