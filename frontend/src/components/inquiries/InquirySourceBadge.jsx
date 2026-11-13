import React from 'react';
import { Bot, FileText, ShieldCheck } from 'lucide-react';

export default function InquirySourceBadge({ source, consentAccepted = false }) {
  const isAiChatbot = source === 'ai_chatbot';

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
          isAiChatbot
            ? 'bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/30'
            : 'bg-slate-100 text-[#64748B] border-[#E2E8F0]'
        }`}
      >
        {isAiChatbot ? <Bot className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
        <span>{isAiChatbot ? 'AI Concierge' : 'Web Form'}</span>
      </span>

      {consentAccepted && (
        <span
          title="RA 10173 Data Privacy consent verified"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Consent Verified</span>
        </span>
      )}
    </div>
  );
}
