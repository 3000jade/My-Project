import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Pencil, MessagesSquare, Link2, BedDouble, Bath, Ruler, LandPlot, MapPin, ArrowLeft } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import StatusBadge from '../../../components/agent/ui/StatusBadge.jsx'
import PropertyThumb from '../../../components/agent/ui/PropertyThumb.jsx'
import LeadCard from '../../../components/agent/ui/LeadCard.jsx'
import Modal from '../../../components/agent/ui/Modal.jsx'
import EmptyState from '../../../components/agent/ui/EmptyState.jsx'
import { propertyStatusTone, inquiryStatusTone, transactionStatusTone } from '../../../utils/agent/tone.js'
import { PROPERTY_STATUSES, formatPHP, formatDate } from '../../../data/agentMockData.js'

export default function PropertyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { properties, inquiries, leads, transactions, changePropertyStatus, showToast } = useApp()
  const [statusModalOpen, setStatusModalOpen] = useState(false)

  const property = properties.find((p) => p.id === id)

  if (!property) {
    return (
      <EmptyState
        title="Property not found"
        message="This listing may have been deleted."
        action={
          <Button variant="primary" onClick={() => navigate('/agent/properties')}>
            Back to My Properties
          </Button>
        }
      />
    )
  }

  const relatedInquiries = inquiries.filter((i) => i.propertyId === property.id).slice(0, 5)
  const relatedLeads = leads.filter((l) => l.interestedPropertyIds?.includes(property.id))
  const relatedTransaction = transactions.find((t) => t.propertyId === property.id)

  function generateListingLink() {
    const link = `https://realtyconnect.ph/listings/${property.id}`
    navigator.clipboard?.writeText(link).catch(() => {})
    showToast('Listing link copied to clipboard.')
  }

  return (
    <div>
      <button onClick={() => navigate('/agent/properties')} className="mb-3 flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:underline">
        <ArrowLeft size={15} /> Back to My Properties
      </button>

      <PageHeader title={property.name} subtitle={property.address}>
        <Button variant="secondary" icon={Pencil} onClick={() => navigate(`/agent/properties/${property.id}/edit`)}>
          Edit Property
        </Button>
        <Button variant="secondary" onClick={() => setStatusModalOpen(true)}>
          Change Status
        </Button>
        <Button variant="secondary" icon={MessagesSquare} onClick={() => navigate('/agent/inquiries')}>
          View Inquiries
        </Button>
        <Button variant="primary" icon={Link2} onClick={generateListingLink}>
          Generate Listing Link
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-surface-200 bg-white p-3 shadow-card">
            <div className="col-span-3 sm:col-span-2">
              <PropertyThumb id={property.id} type={property.type} className="h-64" />
            </div>
            <div className="col-span-3 grid grid-cols-3 gap-2 sm:col-span-1 sm:grid-cols-1">
              <PropertyThumb id={property.id + '2'} type={property.type} className="h-20 sm:h-[7.75rem]" />
              <PropertyThumb id={property.id + '3'} type={property.type} className="h-20 sm:h-[7.75rem]" />
              <PropertyThumb id={property.id + '4'} type={property.type} className="h-20 sm:h-[7.75rem]" />
            </div>
          </div>

          <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm text-ink-500">
                  <MapPin size={14} /> {property.location}
                </p>
                <p className="mt-1 text-2xl font-bold text-teal-600">{formatPHP(property.price)}</p>
              </div>
              <StatusBadge label={property.status} tone={propertyStatusTone(property.status)} />
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-700">{property.description}</p>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-surface-100 pt-4 sm:grid-cols-4">
              <div className="flex items-center gap-2 text-sm text-ink-600">
                <BedDouble size={16} className="text-teal-600" /> {property.bedrooms} Bedrooms
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-600">
                <Bath size={16} className="text-teal-600" /> {property.bathrooms} Bathrooms
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-600">
                <Ruler size={16} className="text-teal-600" /> {property.floorArea || '—'} sqm floor
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-600">
                <LandPlot size={16} className="text-teal-600" /> {property.lotArea || '—'} sqm lot
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-surface-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
              <p className="text-sm font-semibold text-darkteal-800">Recent Inquiries ({property.inquiryCount})</p>
              <Link to="/agent/inquiries" className="text-xs font-semibold text-teal-600 hover:underline">
                View all
              </Link>
            </div>
            {relatedInquiries.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-400">No inquiries yet for this property.</p>
            ) : (
              <div className="divide-y divide-surface-100">
                {relatedInquiries.map((inq) => (
                  <div key={inq.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-darkteal-800">{inq.client.name}</p>
                      <p className="text-xs text-ink-500">{inq.inquiryType}</p>
                    </div>
                    <StatusBadge label={inq.status} tone={inquiryStatusTone(inq.status)} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
            <p className="mb-3 text-sm font-semibold text-darkteal-800">Listing Summary</p>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Property Type</dt>
                <dd className="font-medium text-ink-800">{property.type}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Date Listed</dt>
                <dd className="font-medium text-ink-800">{formatDate(property.dateListed)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Total Inquiries</dt>
                <dd className="font-medium text-ink-800">{property.inquiryCount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Total Leads</dt>
                <dd className="font-medium text-ink-800">{property.leadCount}</dd>
              </div>
            </dl>
          </div>

          {relatedTransaction && (
            <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
              <p className="mb-3 text-sm font-semibold text-darkteal-800">Sales Information</p>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-ink-500">Sale Price</dt>
                  <dd className="font-medium text-ink-800">{formatPHP(relatedTransaction.salePrice)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-500">Client</dt>
                  <dd className="font-medium text-ink-800">{relatedTransaction.clientName}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-500">Status</dt>
                  <dd>
                    <StatusBadge label={relatedTransaction.status} tone={transactionStatusTone(relatedTransaction.status)} size="sm" />
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-500">Commission</dt>
                  <dd className="font-medium text-ink-800">{formatPHP(relatedTransaction.commission)}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
            <p className="mb-3 text-sm font-semibold text-darkteal-800">Interested Leads ({relatedLeads.length})</p>
            {relatedLeads.length === 0 ? (
              <p className="text-sm text-ink-400">No CRM leads linked to this property yet.</p>
            ) : (
              <div className="space-y-3">
                {relatedLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onView={(l) => navigate(`/agent/crm/leads/${l.id}`)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Change Listing Status"
        subtitle={property.name}
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setStatusModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {PROPERTY_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => {
                changePropertyStatus(property.id, status)
                setStatusModalOpen(false)
              }}
              className={`rounded-md border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                property.status === status ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-surface-300 text-ink-700 hover:bg-surface-100'
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
