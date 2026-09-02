import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../../components/agent/ui/Modal.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import { CheckCircle2 } from 'lucide-react'
import { formatPHP } from '../../../data/agentMockData.js'

const inputClass =
  'w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

export default function ConvertToLeadModal({ open, onClose, inquiry, property, onConvert }) {
  const navigate = useNavigate()
  const [budget, setBudget] = useState(property?.price ?? '')
  const [preferredLocation, setPreferredLocation] = useState(property?.location ?? '')
  const [createdLead, setCreatedLead] = useState(null)

  if (!inquiry) return null

  function handleConvert() {
    const lead = onConvert(inquiry, { budget: Number(budget) || null, preferredLocation, propertyPreferences: inquiry.inquiryType })
    setCreatedLead(lead)
  }

  function handleClose() {
    setCreatedLead(null)
    onClose()
  }

  if (createdLead) {
    return (
      <Modal
        open={open}
        onClose={handleClose}
        title="Lead Created"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleClose()
                navigate(`/agent/crm/leads/${createdLead.id}`)
              }}
            >
              View Lead
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 size={40} className="text-teal-500" />
          <p className="text-sm font-medium text-darkteal-800">Inquiry successfully converted to lead.</p>
          <p className="text-xs text-ink-500">{createdLead.name} has been added to your CRM pipeline.</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Convert to Lead"
      subtitle={inquiry.client.name}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConvert}>
            Convert to Lead
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="rounded-md border border-surface-200 bg-surface-50 p-3">
          <p className="font-medium text-darkteal-800">{inquiry.client.name}</p>
          <p className="text-xs text-ink-500">{inquiry.client.email}</p>
          <p className="text-xs text-ink-500">{inquiry.client.phone}</p>
        </div>
        {property && (
          <div className="rounded-md border border-surface-200 bg-surface-50 p-3">
            <p className="font-medium text-darkteal-800">{property.name}</p>
            <p className="text-xs text-ink-500">
              {property.location} · {formatPHP(property.price)}
            </p>
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Budget (₱)</label>
          <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Preferred Location</label>
          <input value={preferredLocation} onChange={(e) => setPreferredLocation(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">Property Interest</label>
          <input value={property?.name ?? inquiry.inquiryType} disabled className={`${inputClass} bg-surface-100 text-ink-500`} />
        </div>
      </div>
    </Modal>
  )
}
