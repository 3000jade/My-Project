import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMessageCircle2, IconX, IconSend, IconRobot } from '@tabler/icons-react';
import { mockProperties } from '../../utils/mockProperties';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', text: 'How can I help you?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = (e, textOverride = null) => {
    if (e) e.preventDefault();
    const userText = textOverride || inputValue;
    if (!userText.trim()) return;

    const newMsg = { id: Date.now(), type: 'user', text: userText };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response based on mock data
    setTimeout(() => {
      setIsTyping(false);
      
      const query = userText.toLowerCase();
      let responseText = "I'm sorry, I couldn't find exact matches for that right now. Could you specify a location like Makati, BGC, or Cebu?";
      
      // 1. Check if a specific property is mentioned by name
      const specificProperty = mockProperties.find(p => query.includes(p.name.toLowerCase()) || query.includes(p.name.split(' ')[0].toLowerCase() + ' ' + (p.name.split(' ')[1] || '').toLowerCase()));
      
      if (specificProperty) {
        // Answer specific details about this property
        if (query.includes('price') || query.includes('how much') || query.includes('cost')) {
          responseText = `The price for ${specificProperty.name} is ${specificProperty.price}.`;
        } else if (query.includes('location') || query.includes('where') || query.includes('address')) {
          responseText = `${specificProperty.name} is located at ${specificProperty.address} (${specificProperty.location}).`;
        } else if (query.includes('bed') || query.includes('room')) {
          responseText = `It features ${specificProperty.beds} spacious bedrooms.`;
        } else if (query.includes('bath')) {
          responseText = `It has ${specificProperty.baths} luxurious bathrooms.`;
        } else if (query.includes('amenities') || query.includes('features') || query.includes('facilities')) {
          responseText = `The amenities for ${specificProperty.name} include: ${specificProperty.amenities.join(', ')}.`;
        } else if (query.includes('size') || query.includes('sqm') || query.includes('area') || query.includes('how big')) {
          responseText = `The total floor area is ${specificProperty.sqm}.`;
        } else if (query.includes('agent') || query.includes('broker') || query.includes('who')) {
          responseText = `This property is exclusively handled by ${specificProperty.agent.name}, our ${specificProperty.agent.title}.`;
        } else {
          responseText = `${specificProperty.name} in ${specificProperty.location} is an incredible ${specificProperty.propertyType} listed at ${specificProperty.price}. It has ${specificProperty.beds} beds and ${specificProperty.baths} baths. Would you like to know about its amenities or schedule a viewing?`;
        }
      } else {
        // 2. General Search (Location or Type)
        const matches = mockProperties.filter(p => 
          query.includes(p.propertyType.toLowerCase()) || 
          query.includes(p.location.split(',')[0].toLowerCase()) ||
          query.includes(p.badge.toLowerCase())
        );

        if (matches.length > 0) {
          responseText = `I found ${matches.length} propert${matches.length > 1 ? 'ies' : 'y'} that might interest you! For example, ${matches[0].name} in ${matches[0].location} is listed at ${matches[0].price}. You can ask me for more details like "What is the price of ${matches[0].name}?"`;
        } else if (query.includes('hi') || query.includes('hello') || query.includes('hey')) {
          responseText = "Hello! I am your Private Concierge. I can help you find properties or answer specific questions like 'What is the price of the Forbes Park Mansion?' or 'Show me penthouses in Makati'.";
        }
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        text: responseText
      }]);
    }, 1500);
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
            className="w-[380px] md:w-[440px] mb-4 bg-white/95 backdrop-blur-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] rounded-2xl overflow-hidden border border-[#E5E7EB] flex flex-col pointer-events-auto"
            style={{ height: '550px', maxHeight: '75vh' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#174849] to-[#266F71] p-4 flex justify-between items-center text-white shrink-0 shadow-sm relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-inner">
                    <IconRobot size={22} className="text-white drop-shadow-md" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#4ADE80] border-2 border-[#266F71] rounded-full animate-pulse shadow-sm"></div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-[15px] leading-tight tracking-wide">Private Concierge</h3>
                  <p className="text-[10px] font-sans text-white/80 uppercase tracking-widest mt-0.5">Online</p>
                </div>
              </div>
              <button 
                onClick={toggleChat}
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

            {/* Quick Selectors */}
            <div className="px-4 py-2.5 bg-white border-t border-[#E5E7EB] grid grid-cols-3 gap-1.5 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
              {['Show Penthouses', 'Price of Forbes', 'Contact Agent'].map((suggestion) => (
                <button 
                  key={suggestion}
                  onClick={() => handleSend(null, suggestion)}
                  className="w-full h-full px-1 py-1.5 rounded-lg border border-[#266F71]/30 text-[#266F71] text-[9.5px] font-sans font-bold uppercase tracking-widest hover:bg-[#266F71] hover:text-white transition-all shadow-sm flex items-center justify-center text-center leading-tight"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-[#E5E7EB] shrink-0 relative z-10">
              <form onSubmit={handleSend} className="flex gap-2 relative">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 bg-[#F1F0EC] border-transparent focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] rounded-full text-sm font-sans pl-5 pr-12 py-3 outline-none transition-all text-[#1B1C1A] placeholder:text-[#1B1C1A]/40"
                  placeholder="Type your message..."
                  type="text"
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 w-9 bg-[#266F71] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center hover:bg-[#174849] transition-colors shadow-sm"
                >
                  <IconSend size={16} className="ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto bg-gradient-to-br from-[#266F71] to-[#174849] text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-[0_8px_20px_rgba(38,111,113,0.4)] flex items-center justify-center relative group overflow-hidden border border-white/20"
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
