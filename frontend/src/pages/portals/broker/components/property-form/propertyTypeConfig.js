import {
  Home,
  Building,
  Building2,
  Layers,
  MapPin,
  Trees,
  Briefcase,
  Warehouse,
  Hotel,
  KeyRound,
  Landmark,
} from 'lucide-react';

export const ASSET_FAMILIES = {
  DWELLING: 'dwelling',
  STRATA: 'strata',
  LAND: 'land',
  COMMERCIAL: 'commercial',
  INDUSTRIAL: 'industrial',
};

export const CONDO_UNIT_CUTS = [
  { value: 'studio', label: 'Studio' },
  { value: '1br', label: '1-Bedroom (1BR)' },
  { value: '2bedroom', label: '2-Bedroom (2BR)' },
  { value: '3br', label: '3-Bedroom (3BR)' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'loft', label: 'Loft-type' },
];

export const PROPERTY_CATEGORIES = [
  {
    id: 'houseAndLot',
    title: 'House & Lot (Horizontal Residential)',
    description: 'Detached, attached, townhouse, duplex/triplex, bungalow, and rowhouse homes',
    icon: Home,
    types: [
      {
        id: 'singleDetached',
        name: 'Single-Detached',
        description: 'Standalone house on a lot with open yard space on all four sides.',
        icon: Home,
        family: ASSET_FAMILIES.DWELLING,
        dbTypeId: 2,
        isPrimary: true,
      },
      {
        id: 'singleAttached',
        name: 'Single-Attached',
        description: 'Built on one boundary of the lot, leaving yard space on the front, back, and one side.',
        icon: Home,
        family: ASSET_FAMILIES.DWELLING,
        dbTypeId: 2,
        isPrimary: true,
      },
      {
        id: 'townhouse',
        name: 'Townhouse',
        description: 'Multi-story unit sharing one or two side walls with neighbors in a row or gated compound.',
        icon: Building,
        family: ASSET_FAMILIES.DWELLING,
        dbTypeId: 3,
        isPrimary: true,
      },
      {
        id: 'duplexTriplex',
        name: 'Duplex / Triplex',
        description: 'One building structure divided into two or three separate residential units with separate entrances.',
        icon: Layers,
        family: ASSET_FAMILIES.DWELLING,
        dbTypeId: 2,
        isPrimary: false,
      },
      {
        id: 'bungalow',
        name: 'Bungalow',
        description: 'Single-story detached house with all rooms on the ground level.',
        icon: Home,
        family: ASSET_FAMILIES.DWELLING,
        dbTypeId: 2,
        isPrimary: false,
      },
      {
        id: 'rowhouse',
        name: 'Rowhouse',
        description: 'Uniform, single- or two-story attached units commonly found in economic or socialized housing.',
        icon: Building,
        family: ASSET_FAMILIES.DWELLING,
        dbTypeId: 2,
        isPrimary: false,
      },
    ],
  },
  {
    id: 'condominiums',
    title: 'Condominiums (Vertical Residential)',
    description: 'Condo units by cut, condotels, and serviced apartments',
    icon: Building2,
    types: [
      {
        id: 'condoUnit',
        name: 'Condo Unit (by cut)',
        description: 'Studio, 1-Bedroom (1BR), 2-Bedroom (2BR), 3-Bedroom (3BR), Penthouse, and Loft-type units.',
        icon: Building2,
        family: ASSET_FAMILIES.STRATA,
        dbTypeId: 1,
        isPrimary: true,
      },
      {
        id: 'condotel',
        name: 'Condotel',
        description: 'Condominium units operated like a hotel, often located in leisure or tourist destinations (e.g., Tagaytay, Boracay, Batangas).',
        icon: Hotel,
        family: ASSET_FAMILIES.STRATA,
        dbTypeId: 1,
        isPrimary: false,
      },
      {
        id: 'servicedApartment',
        name: 'Serviced Apartment',
        description: 'Furnished units with hotel-style housekeeping and amenities for short- to medium-term stays.',
        icon: KeyRound,
        family: ASSET_FAMILIES.STRATA,
        dbTypeId: 1,
        isPrimary: false,
      },
    ],
  },
  {
    id: 'landLots',
    title: 'Land / Lots',
    description: 'Residential, commercial, industrial, agricultural/farm, and memorial lots',
    icon: MapPin,
    types: [
      {
        id: 'residentialLot',
        name: 'Residential Lot',
        description: 'Vacant titled lot inside a subdivision or residential zone.',
        icon: MapPin,
        family: ASSET_FAMILIES.LAND,
        dbTypeId: 2,
        isPrimary: true,
      },
      {
        id: 'commercialLot',
        name: 'Commercial Lot',
        description: 'Land along major roads or business districts zoned for retail, offices, or buildings.',
        icon: Briefcase,
        family: ASSET_FAMILIES.LAND,
        dbTypeId: 5,
        isPrimary: false,
      },
      {
        id: 'industrialLot',
        name: 'Industrial Lot',
        description: 'Large parcels zoned for warehouses, logistics, or manufacturing.',
        icon: Warehouse,
        family: ASSET_FAMILIES.LAND,
        dbTypeId: 5,
        isPrimary: false,
      },
      {
        id: 'agriculturalLot',
        name: 'Agricultural / Farm Lot',
        description: 'Raw land, orchards, fishponds, or leisure farms.',
        icon: Trees,
        family: ASSET_FAMILIES.LAND,
        dbTypeId: 2,
        isPrimary: false,
      },
      {
        id: 'memorialLot',
        name: 'Memorial Lot',
        description: 'Cemetery plots or columbarium niches.',
        icon: Landmark,
        family: ASSET_FAMILIES.LAND,
        dbTypeId: 2,
        isPrimary: false,
      },
    ],
  },
];

// Flat lookup array of all supported property types
export const ALL_PROPERTY_TYPES = PROPERTY_CATEGORIES.flatMap(cat => cat.types);

// Get property type config by ID or name
export function getPropertyTypeConfig(typeId) {
  if (!typeId) return null;
  const normalized = String(typeId).toLowerCase();
  return (
    ALL_PROPERTY_TYPES.find(
      t => t.id.toLowerCase() === normalized || t.name.toLowerCase() === normalized
    ) || null
  );
}

// Resolve asset family (dwelling, strata, land, commercial, industrial)
export function getAssetFamily(typeId) {
  const cfg = getPropertyTypeConfig(typeId);
  if (cfg) return cfg.family;

  // Fallback string matching for backward compatibility
  const normalized = String(typeId || '').toLowerCase();
  if (normalized.includes('house') || normalized.includes('townhouse') || normalized.includes('duplex') || normalized.includes('bungalow') || normalized.includes('villa')) return ASSET_FAMILIES.DWELLING;
  if (normalized.includes('condo') || normalized.includes('strata') || normalized.includes('apartment') || normalized.includes('studio') || normalized.includes('penthouse')) return ASSET_FAMILIES.STRATA;
  if (normalized.includes('office') || normalized.includes('retail') || normalized.includes('commercial') || normalized.includes('shophouse') || normalized.includes('building')) {
    return ASSET_FAMILIES.COMMERCIAL;
  }
  if (normalized.includes('warehouse') || normalized.includes('factory') || normalized.includes('industrial')) {
    return ASSET_FAMILIES.INDUSTRIAL;
  }
  if (normalized.includes('lot') || normalized.includes('land')) return ASSET_FAMILIES.LAND;
  return ASSET_FAMILIES.DWELLING;
}

export function isLandFamily(typeId) {
  return getAssetFamily(typeId) === ASSET_FAMILIES.LAND;
}

export function isStrataFamily(typeId) {
  return getAssetFamily(typeId) === ASSET_FAMILIES.STRATA;
}

export function isDwellingFamily(typeId) {
  return getAssetFamily(typeId) === ASSET_FAMILIES.DWELLING;
}

export function isCommercialFamily(typeId) {
  return getAssetFamily(typeId) === ASSET_FAMILIES.COMMERCIAL;
}

export function isIndustrialFamily(typeId) {
  return getAssetFamily(typeId) === ASSET_FAMILIES.INDUSTRIAL;
}

export const CATEGORY_AMENITIES_MAP = {
  dwelling: [
    'Smart Home Automation',
    'Wine Cellar',
    'Private Elevator',
    'Staff Quarters',
    'Walk-in Closet',
    'High Ceilings',
    "Chef's Kitchen",
    'Marble Countertops',
    'Home Office',
    'Spa / Sauna',
    'Swimming Pool',
    'Landscaped Garden',
    '24/7 Gated Security',
    'Clubhouse Access'
  ],
  strata: [
    'Smart Home Automation',
    'Private Balcony',
    'High Ceilings',
    'Floor-to-Ceiling Windows',
    'Walk-in Closet',
    'Home Office',
    'Infinity Pool',
    'Fitness Gym',
    'Function Room',
    'Sky Lounge',
    '24/7 Concierge & Security'
  ],
  land: [
    'Electricity Grid Connection (Meralco / Coop)',
    'Deep Well / Potable Water Source',
    'Local Water District Connected',
    'Concrete Paved Road Access',
    'Perimeter Fence / Boundary Markers',
    'Drainage Canal / Gutter Installed',
    'Mountain / Ridge View',
    'Sea / Ocean View',
    'Fruit-Bearing Trees',
    'Irrigation System / River Access',
    '24/7 Guarded Gatehouse'
  ],
  commercial: [
    '100% Full Power Backup Generator',
    'High-Speed Fiber Redundancy',
    'Central VRF Air Conditioning',
    'Fire Sprinkler & Smoke Detectors',
    'Passenger & Service Elevators',
    '24/7 Security Access & CCTV',
    'Executive Lounge',
    'Basement Parking Access'
  ],
  industrial: [
    '3-Phase Industrial Power Supply',
    'Elevated High-Bay Loading Docks',
    'Container Truck Turning Radius',
    'Fire Deluge & Hydrant System',
    'Heavy-Duty Reinforced Concrete Slab',
    'Gantry Crane Ready',
    'Gated Perimeter Wall & Guardhouse',
    'Weighbridge / Scale Station Access'
  ]
};

// Backward compatibility exports for existing components (e.g. PropertyFilterToolbar, BrokerPropertyTypeSelect)
export const PRIMARY_PROPERTY_TYPES = ALL_PROPERTY_TYPES.filter(t => t.isPrimary);
export const SECONDARY_PROPERTY_TYPES = ALL_PROPERTY_TYPES.filter(t => !t.isPrimary);
export const COMMON_PROPERTY_TYPES = ALL_PROPERTY_TYPES;

