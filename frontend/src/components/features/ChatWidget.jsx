import { useState } from 'react';
import '../styles/ChatWidget.css';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end" id="ai-chat">
      {isOpen && (
        <div
          className="w-80 mb-4 bg-white shadow-2xl rounded-2xl overflow-hidden border border-surface-container-high animate-[fadeInUp_0.4s_ease-out_forwards]"
          id="chat-window"
        >
          <div className="bg-primary p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-accent">shield_person</span>
              <span className="font-label-lg text-label-lg uppercase tracking-widest">Strategic Advisor</span>
            </div>
            <button className="material-symbols-outlined hover:rotate-90 transition-transform" onClick={toggleChat}>
              close
            </button>
          </div>
          <div className="h-64 p-4 overflow-y-auto bg-surface-container-low custom-scrollbar space-y-4">
            <div className="bg-white p-3 rounded-xl border border-surface-container-high max-w-[85%] shadow-sm">
              <p className="text-sm">Welcome to PropAI. How may I assist your portfolio objectives today?</p>
            </div>
            <div className="bg-primary text-white p-3 rounded-xl ml-auto max-w-[85%] shadow-sm">
              <p className="text-sm">Show me villas in Monaco with projected growth above 5%.</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-surface-container-high max-w-[85%] shadow-sm">
              <p className="text-sm italic">
                Analyzing Monaco market trends... I have 3 off-market opportunities fitting your criteria. Shall I generate a
                strategic report?
              </p>
            </div>
          </div>
          <div className="p-3 border-t border-surface-container-high bg-white flex gap-2">
            <input
              className="flex-1 bg-surface-container-low border border-surface-container-high rounded-xl focus:ring-1 focus:ring-primary text-sm px-3 py-2 outline-none"
              placeholder="Your message..."
              type="text"
            />
            <button className="bg-accent text-white p-2 flex items-center justify-center rounded-xl hover:bg-accent/90 transition-colors">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      )}
      <button
        className="bg-primary text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform duration-500 animate-pulse-glow"
        onClick={toggleChat}
      >
        <span className="material-symbols-outlined text-3xl">chat</span>
      </button>
    </div>
  );
}
