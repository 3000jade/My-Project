import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { UserCheck } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import SearchBar from '../../../components/agent/ui/SearchBar.jsx'
import StatusBadge from '../../../components/agent/ui/StatusBadge.jsx'
import EmptyState from '../../../components/agent/ui/EmptyState.jsx'
import Modal from '../../../components/agent/ui/Modal.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import { clientStatusTone } from '../../../utils/agent/tone.js'
import { findProperty, formatDate } from '../../../data/agentMockData.js'

const inputClass =
  'w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

export default function Clients() {
  const navigate = useNavigate()
  const { clients, updateClient } = useApp()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [viewClient, setViewClient] = useState(null)
  const [editClient, setEditClient] = useState(null)
  const highlight = searchParams.get('highlight')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return clients.filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
  }, [clients, search])

  return (
    <div>
      <PageHeader title="Clients" subtitle="Buyers who have signed a reservation, contract, or completed transaction." />

      <div className="mb-5 rounded-lg border border-surface-200 bg-white p-4 shadow-card">
        <SearchBar value={search} onChange={setSearch} placeholder="Search clients by name or email..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={UserCheck} title="No clients yet" message="Converted leads will appear here as clients." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-card">
          <div data-lenis-prevent="true" className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned Agent</th>
                  <th className="px-4 py-3 font-medium">Last Activity</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map((client) => {
                  const property = findProperty(client.propertyId)
                  return (
                    <tr key={client.id} className={`hover:bg-surface-50 ${highlight === client.id ? 'bg-teal-50/60' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-darkteal-800">{client.name}</p>
                        <p className="text-xs text-ink-400">{client.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink-600">{client.contact}</p>
                        <p className="text-xs text-ink-400">{client.email}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{property?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={client.status} tone={clientStatusTone(client.status)} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-ink-600">{client.assignedAgent}</td>
                      <td className="px-4 py-3 text-ink-500">{formatDate(client.lastActivity)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2.5 text-xs font-semibold">
                          <button onClick={() => setViewClient(client)} className="text-teal-600 hover:underline">
                            View Client
                          </button>
                          <button onClick={() => setEditClient(client)} className="text-ink-500 hover:underline">
                            Edit
                          </button>
                          <button
                            onClick={() => navigate(`/agent/crm/communication-history?client=${encodeURIComponent(client.name)}`)}
                            className="text-ink-500 hover:underline"
                          >
                            History
                          </button>
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

      <Modal
        open={!!viewClient}
        onClose={() => setViewClient(null)}
        title={viewClient?.name}
        subtitle="Client Profile"
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setViewClient(null)}>
            Close
          </Button>
        }
      >
        {viewClient && (
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Contact</dt>
              <dd className="font-medium text-ink-800">{viewClient.contact}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Email</dt>
              <dd className="font-medium text-ink-800">{viewClient.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Property</dt>
              <dd className="font-medium text-ink-800">{findProperty(viewClient.propertyId)?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Assigned Agent</dt>
              <dd className="font-medium text-ink-800">{viewClient.assignedAgent}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Status</dt>
              <dd>
                <StatusBadge label={viewClient.status} tone={clientStatusTone(viewClient.status)} size="sm" />
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      <Modal
        open={!!editClient}
        onClose={() => setEditClient(null)}
        title="Edit Client"
        subtitle={editClient?.name}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditClient(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                updateClient(editClient.id, editClient)
                setEditClient(null)
              }}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {editClient && (
          <div className="space-y-3 text-sm">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-700">Contact Number</label>
              <input value={editClient.contact} onChange={(e) => setEditClient({ ...editClient, contact: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-700">Email</label>
              <input value={editClient.email} onChange={(e) => setEditClient({ ...editClient, email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-700">Status</label>
              <select value={editClient.status} onChange={(e) => setEditClient({ ...editClient, status: e.target.value })} className={inputClass}>
                <option>Active</option>
                <option>Post-Sale Follow-up</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
