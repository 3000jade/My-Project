import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageSquareText } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import SearchBar from '../../../components/agent/ui/SearchBar.jsx'
import FilterDropdown from '../../../components/agent/ui/FilterDropdown.jsx'
import StatusBadge from '../../../components/agent/ui/StatusBadge.jsx'
import EmptyState from '../../../components/agent/ui/EmptyState.jsx'
import { withinDateFilter, DATE_FILTER_OPTIONS } from '../../../utils/agent/dateFilter.js'
import { findProperty, formatDateTime } from '../../../data/agentMockData.js'

const TYPE_OPTIONS = ['All', 'Agent', 'AI Assistant', 'Internal Note']

const TYPE_TONE = {
  Agent: 'teal-solid',
  'AI Assistant': 'teal-soft',
  'Internal Note': 'orange-soft',
}

export default function CommunicationHistory() {
  const { inquiries, leads } = useApp()
  const [searchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('client') || '')
  const [propertyFilter, setPropertyFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const allComms = useMemo(() => {
    const fromInquiries = inquiries.flatMap((inq) =>
      inq.messages
        .filter((m) => m.sender !== 'client')
        .map((m) => ({
          id: `${inq.id}-${m.id}`,
          date: m.time,
          client: inq.client.name,
          property: findProperty(inq.propertyId)?.name ?? '—',
          message: m.text,
          type: m.sender === 'ai' ? 'AI Assistant' : m.sender === 'note' ? 'Internal Note' : 'Agent',
        }))
    )
    const fromLeads = leads.flatMap((lead) =>
      lead.communicationHistory.map((c, idx) => ({
        id: `${lead.id}-comm-${idx}`,
        date: c.date,
        client: lead.name,
        property: findProperty(lead.interestedPropertyIds?.[0])?.name ?? '—',
        message: `[${c.channel}] ${c.summary}`,
        type: 'Agent',
      }))
    )
    return [...fromInquiries, ...fromLeads].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [inquiries, leads])

  const propertyOptions = useMemo(() => ['All', ...new Set(allComms.map((c) => c.property).filter(Boolean))], [allComms])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allComms.filter((c) => {
      const matchesSearch = !q || c.client.toLowerCase().includes(q)
      const matchesProperty = propertyFilter === 'All' || c.property === propertyFilter
      const matchesType = typeFilter === 'All' || c.type === typeFilter
      const matchesDate = withinDateFilter(c.date, dateFilter, customFrom, customTo)
      return matchesSearch && matchesProperty && matchesType && matchesDate
    })
  }, [allComms, search, propertyFilter, typeFilter, dateFilter, customFrom, customTo])

  return (
    <div>
      <PageHeader title="Communication History" subtitle="A full record of agent, AI, and internal communications across your clients." />

      <div className="mb-5 rounded-lg border border-surface-200 bg-white p-4 shadow-card">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by client name..." />
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterDropdown label="Property" value={propertyFilter} onChange={setPropertyFilter} options={propertyOptions} className="w-56" />
          <FilterDropdown label="Type" value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} className="w-44" />
          <FilterDropdown label="Date" value={dateFilter} onChange={setDateFilter} options={DATE_FILTER_OPTIONS} className="w-40" />
          {dateFilter === 'Custom Range' && (
            <div className="flex items-center gap-1.5">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-md border border-surface-300 px-2 py-1.5 text-xs" />
              <span className="text-xs text-ink-400">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-md border border-surface-300 px-2 py-1.5 text-xs" />
            </div>
          )}
        </div>
      </div>

      <p className="mb-3 text-sm text-ink-500">
        Showing <span className="font-semibold text-darkteal-800">{filtered.length}</span> of {allComms.length} communications
      </p>

      {filtered.length === 0 ? (
        <EmptyState icon={MessageSquareText} title="No communications found" message="Try adjusting your search or filters." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-card">
          <div data-lenis-prevent="true" className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-50">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-500">{formatDateTime(c.date)}</td>
                    <td className="px-4 py-3 font-medium text-darkteal-800">{c.client}</td>
                    <td className="px-4 py-3 text-ink-600">{c.property}</td>
                    <td className="max-w-sm px-4 py-3 text-ink-700">
                      <p className="line-clamp-2">{c.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={c.type} tone={TYPE_TONE[c.type]} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
