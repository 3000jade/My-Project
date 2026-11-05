import {
  Home,
  Building,
  Building2,
  Layers,
  Palmtree,
  MapPin,
  Trees,
  Waves,
  Briefcase,
  Store,
  Warehouse,
} from 'lucide-react';

export const ASSET_FAMILIES = {
  DWELLING: 'dwelling',
  STRATA: 'strata',
  LAND: 'land',
  COMMERCIAL: 'commercial',
  INDUSTRIAL: 'industrial',
};

export const PROPERTY_CATEGORIES = [
  {
    id: 'homes',
    title: 'Homes & Living',
    description: 'Single-family homes, townhouses, condominiums, and residential suites',
    icon: Home,
    types: [
      {
        id: 'houseAndLot',
        name: 'House and Lot',
        description: 'Standalone house with private yard and land ownership',
        icon: Home,
        family: ASSET_FAMILIES.DWELLING,
        dbTypeId: 2,
        isPrimary: true,
      },
      {
        id: 'townhouse',
        name: 'Townhouse',
        description: 'Multi-level urban residence sharing side party walls',
        icon: Building,
        family: ASSET_FAMILIES.DWELLING,
        dbTypeId: 3,
        isPrimary: false,
      },
      {
        id: 'condominium',
        name: 'Condominium',
        description: 'Private strata unit in a mid-rise or high-rise building',
        icon: Building2,
        family: ASSET_FAMILIES.STRATA,
        dbTypeId: 1,
        isPrimary: true,
      },
      {
        id: 'apartment',
        name: 'Apartment Building',
        description: 'Multi-door residential complex rented out to tenants',
        icon: Layers,
        family: ASSET_FAMILIES.DWELLING,
        dbTypeId: 2,
        isPrimary: false,
      },
      {
        id: 'villa',
        name: 'Villa / Vacation Home',
        description: 'Luxury private compound or resort-style home',
        icon: Palmtree,
        family: ASSET_FAMILIES.DWELLING,
        dbTypeId: 4,
        isPrimary: false,
      },
    ],
  },
  {
    id: 'land',
    title: 'Lots & Land',
    description: 'Subdivision lots, agricultural farmland, and prime acreage',
    icon: MapPin,
    types: [
      {
        id: 'residentialLot',
        name: 'Subdivision Lot',
        description: 'Titled master-planned lot inside a gated community',
        icon: MapPin,
        family: ASSET_FAMILIES.LAND,
        dbTypeId: 2,
        isPrimary: true,
      },
      {
        id: 'agriculturalLot',
        name: 'Farm / Agricultural Land',
        description: 'Farmland, fruit orchard, or rural acreage for planting',
        icon: Trees,
        family: ASSET_FAMILIES.LAND,
        dbTypeId: 2,
        isPrimary: false,
      },
      {
        id: 'commercialLot',
        name: 'Commercial Lot',
        description: 'Prime road-frontage land for business development',
        icon: MapPin,
        family: ASSET_FAMILIES.LAND,
        dbTypeId: 5,
        isPrimary: false,
      },
      {
        id: 'beachfrontLot',
        name: 'Beachfront Property',
        description: 'Coastal or lakeside leisure parcel with water access',
        icon: Waves,
        family: ASSET_FAMILIES.LAND,
        dbTypeId: 2,
        isPrimary: false,
      },
    ],
  },
  {
    id: 'commercial',
    title: 'Commercial & Office',
    description: 'Corporate workspaces, retail storefronts, and commercial buildings',
    icon: Briefcase,
    types: [
      {
        id: 'officeSpace',
        name: 'Office Space',
        description: 'Turnkey or bare office floor in a corporate/IT tower',
        icon: Briefcase,
        family: ASSET_FAMILIES.COMMERCIAL,
        dbTypeId: 5,
        isPrimary: false,
      },
      {
        id: 'retailStore',
        name: 'Storefront / Retail Space',
        description: 'Ground-floor commercial space for shop, clinic, or dining',
        icon: Store,
        family: ASSET_FAMILIES.COMMERCIAL,
        dbTypeId: 5,
        isPrimary: false,
      },
      {
        id: 'commercialBuilding',
        name: 'Commercial Building',
        description: 'Whole multi-level building for offices or retail tenants',
        icon: Building2,
        family: ASSET_FAMILIES.COMMERCIAL,
        dbTypeId: 5,
        isPrimary: false,
      },
    ],
  },
  {
    id: 'industrial',
    title: 'Industrial & Storage',
    description: 'Warehouses, logistics distribution centers, and manufacturing hubs',
    icon: Warehouse,
    types: [
      {
        id: 'warehouse',
        name: 'Warehouse / Logistics Hub',
        description: 'High-bay storage facility with truck loading bays',
        icon: Warehouse,
        family: ASSET_FAMILIES.INDUSTRIAL,
        dbTypeId: 5,
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
  if (normalized.includes('lot') || normalized.includes('land')) return ASSET_FAMILIES.LAND;
  if (normalized.includes('condo') || normalized.includes('strata')) return ASSET_FAMILIES.STRATA;
  if (normalized.includes('office') || normalized.includes('retail') || normalized.includes('commercial')) {
    return ASSET_FAMILIES.COMMERCIAL;
  }
  if (normalized.includes('warehouse') || normalized.includes('industrial')) {
    return ASSET_FAMILIES.INDUSTRIAL;
  }
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

