import { useState } from 'react'
import { FileText, ShieldCheck, Info, Lock } from 'lucide-react'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'

const TABS = [
  { id: 'terms', label: 'Terms & Conditions', icon: FileText },
  { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { id: 'system', label: 'System Information', icon: Info },
]

export default function Terms() {
  const [tab, setTab] = useState('terms')

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Terms & System Information" subtitle="Reference documents for agents using the RealtyConnect platform." />

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-surface-200 bg-white p-1.5 shadow-card">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-teal-500 text-white' : 'text-ink-600 hover:bg-surface-100'
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-surface-200 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2 rounded-md bg-surface-100 px-3 py-2 text-xs text-ink-500">
          <Lock size={13} />
          View-only. Contact your system administrator to request changes to these documents.
        </div>

        {tab === 'terms' && (
          <div className="space-y-4 text-sm leading-relaxed text-ink-700">
            <h3 className="text-base font-semibold text-darkteal-800">Terms & Conditions</h3>
            <p>
              By using the RealtyConnect Agent Portal, you agree to represent property listings accurately, respond to client
              inquiries in good faith, and maintain the confidentiality of client information shared through the platform.
            </p>
            <p>
              Agents are expected to keep their PRC license and DHSUD accreditation current and to comply with all applicable
              real estate laws and RealtyConnect's code of conduct while using this system.
            </p>
            <p>
              RealtyConnect reserves the right to suspend accounts found to be in violation of these terms, including
              misrepresentation of property details or misuse of client data.
            </p>
          </div>
        )}

        {tab === 'privacy' && (
          <div className="space-y-4 text-sm leading-relaxed text-ink-700">
            <h3 className="text-base font-semibold text-darkteal-800">Privacy Policy</h3>
            <p>
              Client information collected through inquiries, CRM records, and communication history is used solely to
              facilitate property transactions and improve service quality. This data is not sold to third parties.
            </p>
            <p>
              AI Assistant conversations are logged for quality assurance and to improve automated responses over time. Agents
              can disable AI handling for any individual inquiry at any time.
            </p>
            <p>Access to client and transaction data is limited to the assigned agent, their brokerage administrators, and authorized support staff.</p>
          </div>
        )}

        {tab === 'system' && (
          <div className="space-y-3 text-sm text-ink-700">
            <h3 className="mb-2 text-base font-semibold text-darkteal-800">System Information</h3>
            <div className="flex justify-between border-b border-surface-100 py-2">
              <span className="text-ink-500">Platform</span>
              <span className="font-medium">RealtyConnect Agent Portal</span>
            </div>
            <div className="flex justify-between border-b border-surface-100 py-2">
              <span className="text-ink-500">Version</span>
              <span className="font-medium">2.4.1</span>
            </div>
            <div className="flex justify-between border-b border-surface-100 py-2">
              <span className="text-ink-500">Environment</span>
              <span className="font-medium">Demo (mock data)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-ink-500">Support</span>
              <span className="font-medium">support@realtyconnect.ph</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
