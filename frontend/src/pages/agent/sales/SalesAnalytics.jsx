import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { MessagesSquare, Users, Percent, Trophy } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import SummaryCard from '../../../components/agent/ui/SummaryCard.jsx'
import { MONTHLY_SALES, SALES_BY_TYPE, SOURCES, formatPHP } from '../../../data/agentMockData.js'

export default function SalesAnalytics() {
  const { inquiries, leads, clients, properties } = useApp()

  const qualifiedLeads = leads.filter((l) => ['Qualified', 'Negotiation', 'Converted'].includes(l.status)).length
  const conversionRate = inquiries.length ? (clients.length / inquiries.length) * 100 : 0

  const inquiryBySource = SOURCES.map((source) => ({
    source,
    count: inquiries.filter((i) => i.source === source).length,
  }))

  const topProperties = [...properties].sort((a, b) => b.inquiryCount - a.inquiryCount).slice(0, 5)

  return (
    <div>
      <PageHeader title="Sales Analytics" subtitle="Deeper insight into your pipeline health and top performers." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard icon={MessagesSquare} label="Inquiry Volume" value={inquiries.length} sublabel="Total inquiries received" />
        <SummaryCard icon={Users} label="Qualified Leads" value={qualifiedLeads} sublabel="Qualified, negotiating, or converted" />
        <SummaryCard icon={Percent} label="Conversion Rate" value={`${conversionRate.toFixed(0)}%`} sublabel="Inquiries that became clients" accent="dark" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
          <p className="mb-1 text-sm font-semibold text-darkteal-800">Sales by Month</p>
          <p className="mb-4 text-xs text-ink-500">Completed sale value trend</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_SALES} margin={{ top: 0, right: 8, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E4E2DA" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5F6B68' }} axisLine={{ stroke: '#E4E2DA' }} tickLine={false} />
                <YAxis tickFormatter={(v) => `₱${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: '#5F6B68' }} axisLine={false} tickLine={false} width={54} />
                <Tooltip formatter={(v) => formatPHP(v)} contentStyle={{ borderRadius: 8, borderColor: '#E4E2DA', fontSize: 12 }} cursor={{ fill: '#F1F0EC' }} />
                <Bar dataKey="sales" fill="#266F71" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
          <p className="mb-1 text-sm font-semibold text-darkteal-800">Sales by Property Type</p>
          <p className="mb-4 text-xs text-ink-500">Completed sale value by category</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SALES_BY_TYPE} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="#E4E2DA" />
                <XAxis type="number" tickFormatter={(v) => `₱${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#5F6B68' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 12, fill: '#5F6B68' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip formatter={(v) => formatPHP(v)} contentStyle={{ borderRadius: 8, borderColor: '#E4E2DA', fontSize: 12 }} cursor={{ fill: '#F1F0EC' }} />
                <Bar dataKey="value" fill="#174849" radius={[0, 4, 4, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
          <p className="mb-1 text-sm font-semibold text-darkteal-800">Inquiry Volume by Source</p>
          <p className="mb-4 text-xs text-ink-500">Where your inquiries are coming from</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inquiryBySource} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E4E2DA" />
                <XAxis dataKey="source" tick={{ fontSize: 12, fill: '#5F6B68' }} axisLine={{ stroke: '#E4E2DA' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#5F6B68' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#E4E2DA', fontSize: 12 }} cursor={{ fill: '#F1F0EC' }} />
                <Bar dataKey="count" fill="#FB8E5D" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-surface-200 bg-white shadow-card">
          <div className="border-b border-surface-100 px-5 py-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-darkteal-800">
              <Trophy size={15} className="text-accent-500" /> Top-Performing Properties
            </p>
            <p className="text-xs text-ink-500">Ranked by total inquiries received</p>
          </div>
          <div className="divide-y divide-surface-100">
            {topProperties.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-darkteal-800">{p.name}</p>
                    <p className="text-xs text-ink-500">{p.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-teal-600">{p.inquiryCount} inquiries</p>
                  <p className="text-xs text-ink-400">{p.leadCount} leads</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
