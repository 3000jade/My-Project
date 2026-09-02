import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UploadCloud, X, ImagePlus } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import { PROPERTY_TYPES, PROPERTY_STATUSES } from '../../../data/agentMockData.js'

const EMPTY = {
  name: '',
  type: PROPERTY_TYPES[0],
  description: '',
  price: '',
  location: '',
  address: '',
  bedrooms: '',
  bathrooms: '',
  floorArea: '',
  lotArea: '',
  status: 'Available',
}

function Field({ label, children, span = 1 }) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

export default function AddProperty() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { properties, addProperty, updateProperty } = useApp()
  const isEdit = Boolean(id)
  const existing = isEdit ? properties.find((p) => p.id === id) : null

  const [form, setForm] = useState(EMPTY)
  const [imagePreviews, setImagePreviews] = useState([])

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        type: existing.type,
        description: existing.description,
        price: existing.price,
        location: existing.location,
        address: existing.address,
        bedrooms: existing.bedrooms,
        bathrooms: existing.bathrooms,
        floorArea: existing.floorArea,
        lotArea: existing.lotArea,
        status: existing.status,
      })
    }
  }, [existing])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleFiles(fileList) {
    const files = Array.from(fileList).slice(0, 8 - imagePreviews.length)
    const next = files.map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, url: URL.createObjectURL(file), name: file.name }))
    setImagePreviews((prev) => [...prev, ...next])
  }

  function removeImage(id) {
    setImagePreviews((prev) => prev.filter((img) => img.id !== id))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      floorArea: Number(form.floorArea) || 0,
      lotArea: Number(form.lotArea) || 0,
      images: imagePreviews.length ? imagePreviews.map((i) => i.name) : existing?.images,
    }
    if (isEdit) {
      updateProperty(existing.id, payload)
      navigate(`/agent/properties/${existing.id}`)
    } else {
      const created = addProperty(payload)
      navigate(`/agent/properties/${created.id}`)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={isEdit ? 'Edit Property' : 'Add Property'}
        subtitle={isEdit ? 'Update the details for this listing.' : 'List a new property for buyers and inquiries.'}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 text-sm font-semibold text-darkteal-800">Property Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Property Name" span={2}>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} placeholder="e.g. 2BR House and Lot" />
            </Field>
            <Field label="Property Type">
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputClass}>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Price (₱)">
              <input required type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} className={inputClass} placeholder="3500000" />
            </Field>
            <Field label="Description" span={2}>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className={inputClass}
                placeholder="Describe the property's features and highlights..."
              />
            </Field>
            <Field label="Location">
              <input required value={form.location} onChange={(e) => set('location', e.target.value)} className={inputClass} placeholder="e.g. Cainta, Rizal" />
            </Field>
            <Field label="Address">
              <input required value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} placeholder="Complete street address" />
            </Field>
            <Field label="Bedrooms">
              <input type="number" min="0" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Bathrooms">
              <input type="number" min="0" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Floor Area (sqm)">
              <input type="number" min="0" value={form.floorArea} onChange={(e) => set('floorArea', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Lot Area (sqm)">
              <input type="number" min="0" value={form.lotArea} onChange={(e) => set('lotArea', e.target.value)} className={inputClass} />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
          <h2 className="mb-1 text-sm font-semibold text-darkteal-800">Property Images</h2>
          <p className="mb-4 text-xs text-ink-500">Upload multiple photos of the property. JPG or PNG, up to 8 images.</p>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-surface-300 bg-surface-50 px-6 py-8 text-center hover:border-teal-400 hover:bg-teal-50/40">
            <UploadCloud size={26} className="text-teal-500" />
            <span className="text-sm font-medium text-darkteal-800">Click to upload images</span>
            <span className="text-xs text-ink-400">or drag and drop files here</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          </label>

          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {imagePreviews.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-md border border-surface-200">
                  <img src={img.url} alt={img.name} className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute right-1 top-1 rounded-full bg-darkteal-900/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {imagePreviews.length === 0 && existing?.images?.length > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-400">
              <ImagePlus size={13} /> {existing.images.length} image(s) currently attached to this listing.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 text-sm font-semibold text-darkteal-800">Listing Status</h2>
          <Field label="Status">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={`${inputClass} sm:w-64`}>
              {PROPERTY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" size="lg">
            Save Property
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
