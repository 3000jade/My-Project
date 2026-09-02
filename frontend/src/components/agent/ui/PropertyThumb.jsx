import { Home, Building2, Warehouse, LandPlot, Store } from 'lucide-react'

const TYPE_ICON = {
  'House and Lot': Home,
  Condominium: Building2,
  Townhouse: Warehouse,
  'Lot Only': LandPlot,
  Commercial: Store,
}

// Deterministic subtle gradient per property so thumbnails feel distinct without external images.
const PALETTES = [
  ['#266F71', '#174849'],
  ['#4F9B9C', '#215F61'],
  ['#7BB4B5', '#174849'],
  ['#174849', '#0F3132'],
  ['#FB8E5D', '#174849'],
]

function paletteFor(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % PALETTES.length
  return PALETTES[Math.abs(hash) % PALETTES.length]
}

export default function PropertyThumb({ id, type, className = 'h-40' }) {
  const Icon = TYPE_ICON[type] || Home
  const [c1, c2] = paletteFor(id || type || 'x')
  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden rounded-md ${className}`}
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      <Icon size={36} className="text-white/85" strokeWidth={1.5} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
    </div>
  )
}
