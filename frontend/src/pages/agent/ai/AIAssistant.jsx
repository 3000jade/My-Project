import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, MessagesSquare, HelpCircle, Users, Percent, ChevronDown } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import SummaryCard from '../../../components/agent/ui/SummaryCard.jsx'
import { AI_STATS, AI_FAQ, findProperty, timeAgo } from '../../../data/agentMockData.js'

function FaqCategory({ category, questions }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-surface-200 bg-white shadow-card">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <span className="text-sm font-semibold text-darkteal-800">{category}</span>
        <ChevronDown size={16} className={`text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="space-y-2 border-t border-surface-100 px-5 py-4">
          {questions.map((q, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-ink-600">
              <HelpCircle size={14} className="mt-0.5 shrink-0 text-teal-500" />
              {q}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AIAssistant() {
  const navigate = useNavigate()
  const { inquiries } = useApp()

  return (
    <div>
      <PageHeader title="AI Property Inquiry Assistant" subtitle="Monitor how your AI assistant is handling client inquiries.">
        <span className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-200">
          <Bot size={14} /> AI Status: {AI_STATS.status}
        </span>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={MessagesSquare} label="Conversations Handled" value={AI_STATS.conversationsHandled} sublabel="All time" />
        <SummaryCard icon={HelpCircle} label="Questions Answered" value={AI_STATS.questionsAnswered} sublabel="All time" accent="orange" />
        <SummaryCard icon={Users} label="Leads Assisted" value={AI_STATS.leadsAssisted} sublabel="Inquiries AI helped qualify" />
        <SummaryCard icon={Percent} label="Conversion Rate" value={`${AI_STATS.conversionRate}%`} sublabel="AI-assisted to converted" accent="dark" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-surface-200 bg-white shadow-card">
          <div className="border-b border-surface-100 px-5 py-4">
            <p className="text-sm font-semibold text-darkteal-800">Recent AI-Assisted Conversations</p>
          </div>
          <div className="divide-y divide-surface-100">
            {inquiries
              .filter((i) => i.aiHandled)
              .slice(0, 6)
              .map((inq) => {
                const property = findProperty(inq.propertyId)
                const lastAiMessage = [...inq.messages].reverse().find((m) => m.sender === 'ai')
                return (
                  <button
                    key={inq.id}
                    onClick={() => navigate(`/agent/inquiries?open=${inq.id}`)}
                    className="flex w-full flex-col gap-1 px-5 py-3.5 text-left hover:bg-surface-50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-darkteal-800">{inq.client.name}</p>
                      <span className="text-xs text-ink-400">{timeAgo(inq.lastActivity)}</span>
                    </div>
                    <p className="text-xs text-ink-500">
                      {property?.name} · {inq.inquiryType}
                    </p>
                    {lastAiMessage && <p className="line-clamp-1 text-xs italic text-teal-700">"{lastAiMessage.text}"</p>}
                  </button>
                )
              })}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold text-darkteal-800">AI Knowledge / FAQ</p>
          {Object.entries(AI_FAQ).map(([category, questions]) => (
            <FaqCategory key={category} category={category} questions={questions} />
          ))}
        </div>
      </div>
    </div>
  )
}
