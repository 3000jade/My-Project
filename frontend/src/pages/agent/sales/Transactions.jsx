import { useMemo, useState } from 'react'
import { Receipt } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import SearchBar from '../../../components/agent/ui/SearchBar.jsx'
import FilterDropdown from '../../../components/agent/ui/FilterDropdown.jsx'
import StatusBadge from '../../../components/agent/ui/StatusBadge.jsx'
import EmptyState from '../../../components/agent/ui/EmptyState.jsx'
import Modal from '../../../components/agent/ui/Modal.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import { transactionStatusTone } from '../../../utils/agent/tone.js'
import { TRANSACTION_STATUSES, findProperty, formatPHP, formatDate } from '../../../data/agentMockData.js'

export default function Transactions() {
  const { transactions, updateTransactionStatus } = useApp()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewTarget, setViewTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions.filter((t) => {
      const property = findProperty(t.propertyId)
      const matchesSearch = !q || t.clientName.toLowerCase().includes(q) || property?.name.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [transactions, search, statusFilter])

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Every recorded sale, from reservation to completed transfer." />

      <div className="mb-5 flex flex-col gap-3 rounded-lg border border-surface-200 bg-white p-4 shadow-card sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by client or property..." className="sm:flex-1" />
        <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={['All', ...TRANSACTION_STATUSES]} className="w-44" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No transactions found" message="Try adjusting your search or filters." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-card">
          <div data-lenis-prevent="true" className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Sale Price</th>
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Transaction Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Commission</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map((t) => {
                  const property = findProperty(t.propertyId)
                  return (
                    <tr key={t.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3 font-medium text-darkteal-800">{property?.name}</td>
                      <td className="px-4 py-3 text-ink-600">{t.clientName}</td>
                      <td className="px-4 py-3 text-ink-600">{formatPHP(t.salePrice)}</td>
                      <td className="px-4 py-3 text-ink-600">{t.agent}</td>
                      <td className="px-4 py-3 text-ink-500">{formatDate(t.date)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={t.status} tone={transactionStatusTone(t.status)} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-ink-600">{formatPHP(t.commission)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2.5 text-xs font-semibold">
                          <button onClick={() => setViewTarget(t)} className="text-teal-600 hover:underline">
                            View
                          </button>
                          <button onClick={() => setStatusTarget(t)} className="text-ink-500 hover:underline">
                            Update Status
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
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={viewTarget?.id}
        subtitle="Transaction Details"
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setViewTarget(null)}>
            Close
          </Button>
        }
      >
        {viewTarget && (
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Property</dt>
              <dd className="font-medium text-ink-800">{findProperty(viewTarget.propertyId)?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Client</dt>
              <dd className="font-medium text-ink-800">{viewTarget.clientName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Sale Price</dt>
              <dd className="font-medium text-ink-800">{formatPHP(viewTarget.salePrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Commission</dt>
              <dd className="font-medium text-ink-800">{formatPHP(viewTarget.commission)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Transaction Date</dt>
              <dd className="font-medium text-ink-800">{formatDate(viewTarget.date)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Status</dt>
              <dd>
                <StatusBadge label={viewTarget.status} tone={transactionStatusTone(viewTarget.status)} size="sm" />
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title="Update Transaction Status"
        subtitle={statusTarget?.id}
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setStatusTarget(null)}>
            Close
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {TRANSACTION_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => {
                updateTransactionStatus(statusTarget.id, status)
                setStatusTarget(null)
              }}
              className={`rounded-md border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                statusTarget?.status === status ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-surface-300 text-ink-700 hover:bg-surface-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
