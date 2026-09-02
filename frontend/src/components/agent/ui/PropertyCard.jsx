import { BedDouble, Bath, Ruler, MessageSquare, MapPin } from 'lucide-react'
import PropertyThumb from './PropertyThumb.jsx'
import StatusBadge from './StatusBadge.jsx'
import { propertyStatusTone } from '../../../utils/agent/tone.js'
import { formatPHP, formatDate } from '../../../data/agentMockData.js'

export default function PropertyCard({ property, onView, onEdit, onDelete, onChangeStatus }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-surface-200 bg-white shadow-card">
      <div className="p-3 pb-0">
        <PropertyThumb id={property.id} type={property.type} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-darkteal-800">{property.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
              <MapPin size={12} /> {property.location}
            </p>
          </div>
          <StatusBadge label={property.status} tone={propertyStatusTone(property.status)} size="sm" />
        </div>

        <p className="mt-2 text-base font-bold text-teal-600">{formatPHP(property.price)}</p>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble size={13} /> {property.bedrooms} Bed
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath size={13} /> {property.bathrooms} Bath
            </span>
          )}
          <span className="flex items-center gap-1">
            <Ruler size={13} /> {property.floorArea > 0 ? `${property.floorArea} sqm floor` : `${property.lotArea} sqm lot`}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
          <span>Listed {formatDate(property.dateListed)}</span>
          <span className="flex items-center gap-1 font-medium text-teal-600">
            <MessageSquare size={13} /> {property.inquiryCount} inquiries
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-surface-100 pt-3 text-xs font-semibold">
          <button onClick={() => onView(property)} className="text-teal-600 hover:underline">
            View
          </button>
          <span className="text-surface-300">|</span>
          <button onClick={() => onEdit(property)} className="text-ink-600 hover:underline">
            Edit
          </button>
          <span className="text-surface-300">|</span>
          <button onClick={() => onChangeStatus(property)} className="text-ink-600 hover:underline">
            Status
          </button>
          <span className="text-surface-300">|</span>
          <button onClick={() => onDelete(property)} className="text-accent-600 hover:underline">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
