import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import SearchBar from '../../../components/agent/ui/SearchBar.jsx'
import FilterDropdown from '../../../components/agent/ui/FilterDropdown.jsx'
import StatusBadge from '../../../components/agent/ui/StatusBadge.jsx'
import PriorityBadge from '../../../components/agent/ui/PriorityBadge.jsx'
import EmptyState from '../../../components/agent/ui/EmptyState.jsx'
import ConfirmDialog from '../../../components/agent/ui/ConfirmDialog.jsx'
import ScheduleFollowUpModal from '../../../components/agent/modals/ScheduleFollowUpModal.jsx'
import AddLeadModal from './AddLeadModal.jsx'
import { leadStatusTone } from '../../../utils/agent/tone.js'
import { LEAD_STATUSES, PRIORITIES, findProperty, formatPHP, formatDate } from '../../../data/agentMockData.js'

export default function Leads() {
  const navigate = useNavigate()
  const { leads, properties, addLead, addFollowUp, convertLeadToClient, closeLead } = useApp()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [addOpen, setAddOpen] = useState(false)
  const [followUpTarget, setFollowUpTarget] = useState(null)
  const [convertTarget, setConvertTarget] = useState(null)
  const [closeTarget, setCloseTarget] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((l) => {
      const matchesSearch = !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.phone.includes(q)
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter
      const matchesPriority = priorityFilter === 'All' || l.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [leads, search, statusFilter, priorityFilter])

  return (
    <div>
      <PageHeader title="Leads" subtitle="Track and nurture prospective clients through your sales pipeline.">
        <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
          Add Lead
        </Button>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 rounded-lg border border-surface-200 bg-white p-4 shadow-card sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or phone..." className="sm:flex-1" />
        <div className="flex flex-wrap gap-2">
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={['All', ...LEAD_STATUSES]} className="w-40" />
          <FilterDropdown label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={['All', ...PRIORITIES]} className="w-36" />
        </div>
      </div>

      <p className="mb-3 text-sm text-ink-500">
        Showing <span className="font-semibold text-darkteal-800">{filtered.length}</span> of {leads.length} leads
      </p>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No leads found" message="Try adjusting your filters, or add a new lead." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-card">
          <div data-lenis-prevent="true" className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Lead Name</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Interested Property</th>
                  <th className="px-4 py-3 font-medium">Budget</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Last Contact</th>
                  <th className="px-4 py-3 font-medium">Next Follow-up</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map((lead) => {
                  const property = findProperty(lead.interestedPropertyIds?.[0])
                  return (
                    <tr key={lead.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-darkteal-800">{lead.name}</p>
                        <p className="text-xs text-ink-400">{lead.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink-600">{lead.phone}</p>
                        <p className="text-xs text-ink-400">{lead.email}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{property?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-600">{formatPHP(lead.budget)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={lead.status} tone={leadStatusTone(lead.status)} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={lead.priority} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-ink-500">{formatDate(lead.lastContact)}</td>
                      <td className="px-4 py-3 text-ink-500">{lead.nextFollowUp ? formatDate(lead.nextFollowUp) : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2.5 text-xs font-semibold">
                          <button onClick={() => navigate(`/agent/crm/leads/${lead.id}`)} className="text-teal-600 hover:underline">
                            View
                          </button>
                          <button onClick={() => navigate(`/agent/crm/leads/${lead.id}`)} className="text-ink-500 hover:underline">
                            Edit
                          </button>
                          <button onClick={() => setFollowUpTarget(lead)} className="text-ink-500 hover:underline">
                            Follow-up
                          </button>
                          {lead.status !== 'Converted' && (
                            <button onClick={() => setConvertTarget(lead)} className="text-teal-600 hover:underline">
                              Convert
                            </button>
                          )}
                          {!['Converted', 'Lost'].includes(lead.status) && (
                            <button onClick={() => setCloseTarget(lead)} className="text-accent-600 hover:underline">
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddLeadModal open={addOpen} onClose={() => setAddOpen(false)} properties={properties} onCreate={addLead} />

      <ScheduleFollowUpModal
        open={!!followUpTarget}
        onClose={() => setFollowUpTarget(null)}
        clientName={followUpTarget?.name}
        defaultPurpose="Check in on progress"
        onSchedule={(data) =>
          followUpTarget &&
          addFollowUp({
            clientName: followUpTarget.name,
            leadId: followUpTarget.id,
            propertyId: followUpTarget.interestedPropertyIds?.[0] ?? null,
            ...data,
          })
        }
      />

      <ConfirmDialog
        open={!!convertTarget}
        onClose={() => setConvertTarget(null)}
        onConfirm={() => {
          const client = convertLeadToClient(convertTarget)
          navigate(`/agent/crm/clients?highlight=${client.id}`)
        }}
        title="Convert Lead to Client"
        confirmLabel="Convert to Client"
        message={
          <>
            Convert <span className="font-semibold">{convertTarget?.name}</span> into a client record? This usually follows a signed
            reservation or contract.
          </>
        }
      />

      <ConfirmDialog
        open={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={() => closeLead(closeTarget.id)}
        title="Close Lead"
        confirmLabel="Mark as Lost"
        danger
        message={
          <>
            Mark <span className="font-semibold">{closeTarget?.name}</span> as a lost lead? You can still view their history afterwards.
          </>
        }
      />
    </div>
  )
}
