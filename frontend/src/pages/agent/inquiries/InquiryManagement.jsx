import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Inbox, X } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import SearchBar from '../../../components/agent/ui/SearchBar.jsx'
import FilterDropdown from '../../../components/agent/ui/FilterDropdown.jsx'
import StatusBadge from '../../../components/agent/ui/StatusBadge.jsx'
import PriorityBadge from '../../../components/agent/ui/PriorityBadge.jsx'
import EmptyState from '../../../components/agent/ui/EmptyState.jsx'
import Drawer from '../../../components/agent/ui/Drawer.jsx'
import InquiryDrawerContent from './InquiryDrawerContent.jsx'
import NewInquiryModal from './NewInquiryModal.jsx'
import { inquiryStatusTone } from '../../../utils/agent/tone.js'
import { withinDateFilter, DATE_FILTER_OPTIONS } from '../../../utils/agent/dateFilter.js'
import {
  INQUIRY_STATUSES,
  PRIORITIES,
  INQUIRY_TYPES,
  SOURCES,
  findProperty,
  formatDate,
  timeAgo,
} from '../../../data/agentMockData.js'


export default function InquiryManagement({ presetStatus }) {
  const { inquiries, properties, addInquiry } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(presetStatus || 'All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [selectedInquiryId, setSelectedInquiryId] = useState(null)
  const [newInquiryOpen, setNewInquiryOpen] = useState(false)

  useEffect(() => {
    setStatusFilter(presetStatus || 'All')
  }, [presetStatus])

  useEffect(() => {
    const openId = searchParams.get('open')
    const q = searchParams.get('q')
    if (openId) setSelectedInquiryId(openId)
    if (q) setSearch(q)
    if (openId || q) setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(
    () => ({
      all: inquiries.length,
      new: inquiries.filter((i) => i.status === 'New').length,
      inProgress: inquiries.filter((i) => i.status === 'In Progress').length,
      qualified: inquiries.filter((i) => i.status === 'Qualified').length,
      followUp: inquiries.filter((i) => i.status === 'Follow-up').length,
      closed: inquiries.filter((i) => i.status === 'Closed').length,
    }),
    [inquiries]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...inquiries]
      .filter((inq) => {
        const property = findProperty(inq.propertyId)
        const matchesSearch =
          !q ||
          inq.client.name.toLowerCase().includes(q) ||
          inq.client.email.toLowerCase().includes(q) ||
          inq.client.phone.toLowerCase().includes(q) ||
          property?.name.toLowerCase().includes(q)
        const matchesStatus = statusFilter === 'All' || inq.status === statusFilter
        const matchesPriority = priorityFilter === 'All' || inq.priority === priorityFilter
        const matchesType = typeFilter === 'All' || inq.inquiryType === typeFilter
        const matchesSource = sourceFilter === 'All' || inq.source === sourceFilter
        const matchesDate = withinDateFilter(inq.dateReceived, dateFilter, customFrom, customTo)
        return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesSource && matchesDate
      })
      .sort((a, b) => new Date(b.dateReceived) - new Date(a.dateReceived))
  }, [inquiries, search, statusFilter, priorityFilter, typeFilter, sourceFilter, dateFilter, customFrom, customTo])

  function clearFilters() {
    setSearch('')
    setStatusFilter('All')
    setPriorityFilter('All')
    setTypeFilter('All')
    setSourceFilter('All')
    setDateFilter('All')
    setCustomFrom('')
    setCustomTo('')
  }

  const selectedInquiry = selectedInquiryId ? inquiries.find((i) => i.id === selectedInquiryId) : null

  return (
    <div>
      <PageHeader title="Inquiry Management" subtitle="Manage client property inquiries, responses, follow-ups, and lead conversion.">
        <Button variant="primary" icon={Plus} onClick={() => setNewInquiryOpen(true)}>
          New Inquiry
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'All Inquiries', value: counts.all, status: 'All' },
          { label: 'New', value: counts.new, status: 'New', accent: 'orange' },
          { label: 'In Progress', value: counts.inProgress, status: 'In Progress' },
          { label: 'Qualified', value: counts.qualified, status: 'Qualified' },
          { label: 'Follow-up Due', value: counts.followUp, status: 'Follow-up', accent: 'orange' },
          { label: 'Closed', value: counts.closed, status: 'Closed', accent: 'dark' },
        ].map((card) => (
          <button key={card.label} onClick={() => setStatusFilter(card.status)} className="text-left">
            <div
              className={`rounded-lg border bg-white p-3.5 shadow-card transition-colors ${
                statusFilter === card.status ? 'border-teal-500 ring-1 ring-teal-500' : 'border-surface-200'
              }`}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-darkteal-800">{card.value}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-surface-200 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search client, property, email, phone..." className="lg:flex-1" />
          <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={['All', ...INQUIRY_STATUSES]} className="w-40" />
          <FilterDropdown label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={['All', ...PRIORITIES]} className="w-36" />
          <FilterDropdown label="Type" value={typeFilter} onChange={setTypeFilter} options={['All', ...INQUIRY_TYPES]} className="w-52" />
          <FilterDropdown label="Source" value={sourceFilter} onChange={setSourceFilter} options={['All', ...SOURCES]} className="w-36" />
          <FilterDropdown
            label="Date"
            value={dateFilter}
            onChange={setDateFilter}
            options={DATE_FILTER_OPTIONS}
            className="w-40"
          />
          {dateFilter === 'Custom Range' && (
            <div className="flex items-center gap-1.5">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-md border border-surface-300 px-2 py-1.5 text-xs" />
              <span className="text-xs text-ink-400">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-md border border-surface-300 px-2 py-1.5 text-xs" />
            </div>
          )}
        </div>
      </div>

      <p className="mb-3 mt-4 text-sm text-ink-500">
        Showing <span className="font-semibold text-darkteal-800">{filtered.length}</span> of {inquiries.length} inquiries
      </p>

      {filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="No inquiries found" message="Try adjusting your search or filters." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-card">
          <div data-lenis-prevent="true" className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Inquiry Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Last Activity</th>
                  <th className="px-4 py-3 font-medium">Date Received</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map((inq) => {
                  const property = findProperty(inq.propertyId)
                  return (
                    <tr key={inq.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-darkteal-800">{inq.client.name}</p>
                        <p className="text-xs text-ink-400">{inq.client.email}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{property?.name}</td>
                      <td className="px-4 py-3 text-ink-600">{inq.inquiryType}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={inq.status} tone={inquiryStatusTone(inq.status)} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={inq.priority} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-ink-600">{inq.source}</td>
                      <td className="px-4 py-3 text-ink-500">{timeAgo(inq.lastActivity)}</td>
                      <td className="px-4 py-3 text-ink-500">{formatDate(inq.dateReceived)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelectedInquiryId(inq.id)} className="text-xs font-semibold text-teal-600 hover:underline">
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer
        open={!!selectedInquiry}
        onClose={() => setSelectedInquiryId(null)}
        title={selectedInquiry?.client.name}
        subtitle={selectedInquiry ? `${selectedInquiry.id} · ${selectedInquiry.inquiryType}` : ''}
      >
        {selectedInquiry && <InquiryDrawerContent inquiryId={selectedInquiry.id} onClose={() => setSelectedInquiryId(null)} />}
      </Drawer>

      <NewInquiryModal
        open={newInquiryOpen}
        onClose={() => setNewInquiryOpen(false)}
        properties={properties}
        onCreate={addInquiry}
      />
    </div>
  )
}
