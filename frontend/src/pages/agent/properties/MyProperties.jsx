import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2 } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import SearchBar from '../../../components/agent/ui/SearchBar.jsx'
import FilterDropdown from '../../../components/agent/ui/FilterDropdown.jsx'
import PropertyCard from '../../../components/agent/ui/PropertyCard.jsx'
import EmptyState from '../../../components/agent/ui/EmptyState.jsx'
import Modal from '../../../components/agent/ui/Modal.jsx'
import ConfirmDialog from '../../../components/agent/ui/ConfirmDialog.jsx'
import { PROPERTY_TYPES, PROPERTY_STATUSES } from '../../../data/agentMockData.js'

export default function MyProperties() {
  const navigate = useNavigate()
  const { properties, changePropertyStatus, deleteProperty } = useApp()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [statusModalProperty, setStatusModalProperty] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return properties.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
      const matchesType = typeFilter === 'All' || p.type === typeFilter
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [properties, search, typeFilter, statusFilter])

  return (
    <div>
      <PageHeader title="My Properties" subtitle="Manage every listing you're currently handling.">
        <Button variant="primary" icon={Plus} onClick={() => navigate('/agent/properties/add')}>
          Add Property
        </Button>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 rounded-lg border border-surface-200 bg-white p-4 shadow-card sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by property name or location..." className="sm:flex-1" />
        <div className="flex flex-wrap gap-2">
          <FilterDropdown label="Type" value={typeFilter} onChange={setTypeFilter} options={['All', ...PROPERTY_TYPES]} className="w-44" />
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={['All', ...PROPERTY_STATUSES]}
            className="w-44"
          />
        </div>
      </div>

      <p className="mb-3 text-sm text-ink-500">
        Showing <span className="font-semibold text-darkteal-800">{filtered.length}</span> of {properties.length} properties
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties found"
          message="Try adjusting your search or filters, or add a new property listing."
          action={
            <Button variant="primary" icon={Plus} onClick={() => navigate('/agent/properties/add')}>
              Add Property
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onView={(p) => navigate(`/agent/properties/${p.id}`)}
              onEdit={(p) => navigate(`/agent/properties/${p.id}/edit`)}
              onDelete={(p) => setDeleteTarget(p)}
              onChangeStatus={(p) => setStatusModalProperty(p)}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!statusModalProperty}
        onClose={() => setStatusModalProperty(null)}
        title="Change Listing Status"
        subtitle={statusModalProperty?.name}
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setStatusModalProperty(null)}>
            Close
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {PROPERTY_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => {
                changePropertyStatus(statusModalProperty.id, status)
                setStatusModalProperty(null)
              }}
              className={`rounded-md border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                statusModalProperty?.status === status
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-surface-300 text-ink-700 hover:bg-surface-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteProperty(deleteTarget.id)}
        title="Delete Property"
        confirmLabel="Delete Property"
        danger
        message={
          <>
            Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>? This action cannot be undone.
          </>
        }
      />
    </div>
  )
}
