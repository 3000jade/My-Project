import type {
  ChatComparisonTable,
  ChatNearbyCommute,
  ChatNearbyLandmark,
  ChatNearbySummary,
  ChatPropertyCard,
  ChatPropertyDetail,
} from '../types/chat.types';
import { GoogleMapsService } from './googleMaps.service';
import { PropertyService, type PropertyFilterQuery } from './property.service';

export interface SearchPropertiesToolInput {
  search?: string;
  city?: string;
  district?: string;
  propertyType?: string;
  transactionType?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number | string;
  baths?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'relevance';
}

const NON_PUBLIC_STANDARD_STATUSES = new Set([
  'draft',
  'pending approval',
  'pending confirmation',
  'action required',
  'hold',
  'canceled',
  'cancelled',
  'expired',
]);

const LANDMARK_CATEGORIES: ReadonlyArray<ChatNearbyLandmark['category']> = [
  'highway',
  'transit',
  'school',
  'hospital',
  'mall',
];

function isVisitorPublicListing(p: any): boolean {
  if (!p || typeof p !== 'object') return false;
  if (p.isPublished === false || p.is_published === false) return false;
  const stdStatus = String(p.standardStatus ?? p.standard_status ?? '').trim().toLowerCase();
  if (stdStatus && NON_PUBLIC_STANDARD_STATUSES.has(stdStatus)) return false;
  return true;
}

function toNullableNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function toNullableString(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Projects a property record onto the strictly visitor-safe public ChatPropertyCard shape.
 * Never copies confidential notes, lockbox codes, or seller direct contact info.
 */
export function projectToChatCard(p: any): ChatPropertyCard {
  const price = toNullableNumber(p?.price) ?? 0;
  const formattedPrice =
    toNullableString(p?.formattedPrice) ?? `₱${price.toLocaleString()}`;
  const mainImage =
    toNullableString(p?.mainImage) ??
    (Array.isArray(p?.images) ? toNullableString(p.images[0]) : null);

  return {
    id: String(p?.id ?? ''),
    title: toNullableString(p?.title) ?? 'Untitled property',
    city: String(p?.location?.city ?? p?.city ?? ''),
    price,
    formattedPrice,
    propertyType: String(p?.specs?.propertyType ?? p?.propertyType ?? 'Residential'),
    transactionType: String(p?.specs?.transactionType ?? p?.transactionType ?? 'For Sale'),
    bedrooms: toNullableNumber(p?.specs?.bedroomsTotal ?? p?.specs?.beds ?? p?.bedrooms),
    bathrooms: toNullableNumber(p?.specs?.bathroomsTotalInteger ?? p?.specs?.baths ?? p?.bathrooms),
    floorArea: toNullableNumber(p?.specs?.livingArea ?? p?.specs?.sqft ?? p?.floorArea),
    lotArea: toNullableNumber(p?.specs?.lotSizeArea ?? p?.lotArea),
    parking: toNullableNumber(p?.specs?.parkingTotal ?? p?.parking),
    mainImage,
    status: String(p?.standardStatus ?? p?.status ?? 'Active'),
  };
}

/**
 * Fetches a single published property in visitor mode and returns a sanitized ChatPropertyDetail.
 */
export async function getPublishedPropertyForChat(
  propertyId: string
): Promise<ChatPropertyDetail | null> {
  const cleanId = typeof propertyId === 'string' ? propertyId.trim() : '';
  if (!cleanId) return null;

  const prop = await PropertyService.findPropertyById(cleanId, undefined, 'visitor', undefined);
  if (!prop || !isVisitorPublicListing(prop)) return null;

  const rawFeatures = [
    ...(Array.isArray(prop.features) ? prop.features : []),
    ...(Array.isArray(prop.interiorFeatures) ? prop.interiorFeatures : []),
    ...(Array.isArray(prop.exteriorFeatures) ? prop.exteriorFeatures : []),
  ];
  const features = Array.from(
    new Set(
      rawFeatures
        .map((f) => (typeof f === 'string' ? f.trim() : ''))
        .filter(Boolean)
    )
  ).slice(0, 12);

  const rawRemarks = toNullableString(prop.publicRemarks);
  const publicRemarks = rawRemarks ? rawRemarks.slice(0, 600) : null;

  const coords = prop.location?.coordinates;
  const coordinates =
    coords && Number.isFinite(Number(coords.lat)) && Number.isFinite(Number(coords.lng))
      ? { lat: Number(coords.lat), lng: Number(coords.lng) }
      : null;

  return {
    ...projectToChatCard(prop),
    address: String(prop.location?.address ?? prop.location?.unparsedAddress ?? ''),
    subdivisionName: toNullableString(prop.location?.subdivisionName),
    buildingName: toNullableString(prop.location?.buildingName ?? prop.location?.building_name),
    associationFee: toNullableNumber(prop.associationFee),
    associationFeeFrequency: toNullableString(prop.associationFeeFrequency),
    features,
    publicRemarks,
    coordinates,
  };
}

/**
 * Searches published properties in visitor mode and returns up to 3 visitor-safe cards.
 */
export async function searchPublishedPropertiesForChat(
  filters: SearchPropertiesToolInput
): Promise<{ cards: ChatPropertyCard[]; totalMatches: number }> {
  const query: PropertyFilterQuery = {
    page: 1,
    limit: 3,
  };

  if (filters.search !== undefined) query.search = filters.search;
  if (filters.city !== undefined) query.city = filters.city;
  if (filters.district !== undefined) query.district = filters.district;
  if (filters.propertyType !== undefined) query.propertyType = filters.propertyType;
  if (filters.transactionType !== undefined) query.transactionType = filters.transactionType;
  if (filters.minPrice !== undefined) query.minPrice = filters.minPrice;
  if (filters.maxPrice !== undefined) query.maxPrice = filters.maxPrice;
  if (filters.beds !== undefined) query.beds = filters.beds;
  if (filters.baths !== undefined) query.baths = filters.baths;
  if (filters.sortBy !== undefined) query.sortBy = filters.sortBy;

  const result = await PropertyService.findProperties(query, 'visitor', undefined);
  const rawList = Array.isArray(result?.properties) ? result.properties : [];
  const publicList = rawList.filter(isVisitorPublicListing);
  const filteredOutCount = rawList.length - publicList.length;

  const cards = publicList.slice(0, 3).map(projectToChatCard);
  const rawTotal = typeof result?.total === 'number' ? result.total : publicList.length;
  const totalMatches = Math.max(cards.length, rawTotal - filteredOutCount);

  return { cards, totalMatches };
}

/**
 * Compares 2 to 3 deduplicated published properties across 9 aligned attribute rows.
 */
export async function comparePublishedPropertiesForChat(
  propertyIds: string[]
): Promise<ChatComparisonTable | null> {
  const uniqueIds = Array.from(
    new Set(
      (Array.isArray(propertyIds) ? propertyIds : [])
        .map((id) => (typeof id === 'string' ? id.trim() : ''))
        .filter(Boolean)
    )
  ).slice(0, 3);

  if (uniqueIds.length < 2) return null;

  const fetched = await Promise.all(uniqueIds.map((id) => getPublishedPropertyForChat(id)));
  const valid = fetched.filter((p): p is ChatPropertyDetail => p !== null);

  if (valid.length < 2) return null;

  return {
    properties: valid.map((p) => ({
      id: p.id,
      title: p.title,
      city: p.city,
      formattedPrice: p.formattedPrice,
    })),
    rows: [
      {
        label: 'Price',
        values: valid.map((p) => p.formattedPrice),
      },
      {
        label: 'Location',
        values: valid.map(
          (p) => [p.subdivisionName, p.city].filter(Boolean).join(', ') || p.address || '—'
        ),
      },
      {
        label: 'Type',
        values: valid.map(
          (p) => [p.propertyType, p.transactionType].filter(Boolean).join(' • ') || '—'
        ),
      },
      {
        label: 'Bedrooms',
        values: valid.map((p) => (p.bedrooms !== null ? String(p.bedrooms) : '—')),
      },
      {
        label: 'Bathrooms',
        values: valid.map((p) => (p.bathrooms !== null ? String(p.bathrooms) : '—')),
      },
      {
        label: 'Floor Area',
        values: valid.map((p) => (p.floorArea !== null ? `${p.floorArea} sqm` : '—')),
      },
      {
        label: 'Lot Area',
        values: valid.map((p) => (p.lotArea !== null ? `${p.lotArea} sqm` : '—')),
      },
      {
        label: 'Parking',
        values: valid.map((p) => (p.parking !== null ? String(p.parking) : '—')),
      },
      {
        label: 'Key Features',
        values: valid.map((p) => (p.features.length > 0 ? p.features.slice(0, 4).join(', ') : '—')),
      },
    ],
  };
}

/**
 * Fetches nearby landmarks and commute estimates for a published property with a timeout guard.
 * Never throws on map errors or timeouts.
 */
export async function getPropertyNearbyForChat(
  propertyId: string,
  timeoutMs: number = 5000
): Promise<ChatNearbySummary | null> {
  const property = await getPublishedPropertyForChat(propertyId);
  if (!property) return null;

  const safeTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 5000;
  const landmarks: ChatNearbyLandmark[] = [];
  const commutes: ChatNearbyCommute[] = [];

  try {
    const nearbyPromise = withTimeout(
      GoogleMapsService.suggestNearbyPlaces({
        latitude: property.coordinates?.lat,
        longitude: property.coordinates?.lng,
        address: property.address,
        city: property.city,
      }),
      safeTimeoutMs
    );

    const commutePromise = property.coordinates
      ? withTimeout(
          GoogleMapsService.calculateCommuteMatrix({
            latitude: property.coordinates.lat,
            longitude: property.coordinates.lng,
          }),
          safeTimeoutMs
        )
      : Promise.resolve([]);

    const [nearbySettled, commuteSettled] = await Promise.allSettled([
      nearbyPromise,
      commutePromise,
    ]);

    if (nearbySettled.status === 'fulfilled' && nearbySettled.value) {
      const res = nearbySettled.value;
      for (const category of LANDMARK_CATEGORIES) {
        const label = toNullableString(res[category]);
        if (label) {
          landmarks.push({ category, label });
        }
      }
    }

    if (commuteSettled.status === 'fulfilled' && Array.isArray(commuteSettled.value)) {
      for (const item of commuteSettled.value) {
        if (commutes.length >= 3) break;
        if (item && item.destinationName && (item.durationText !== 'N/A' || item.distanceText !== 'N/A')) {
          commutes.push({
            destinationName: String(item.destinationName),
            distanceText: String(item.distanceText),
            durationText: String(item.durationText),
          });
        }
      }
    }
  } catch {
    // Graceful degradation: never throw on map lookup failures
  }

  return {
    propertyId: property.id,
    propertyTitle: property.title,
    landmarks,
    commutes,
    unavailable: landmarks.length === 0 && commutes.length === 0,
  };
}
