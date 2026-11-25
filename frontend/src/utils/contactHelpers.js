const OFFICE_HOURS = 'Mon–Fri, 8:30 AM – 5:30 PM';

function osmTileUrl(lat, lng, zoom = 15) {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const rad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  );
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

function googleMapsSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const FALLBACK_BRANCHES = [
  {
    id: 'marikina-main',
    title: 'Marikina Office',
    region: 'Metro Manila',
    address: '26 Domitilla St., Provident Village, Tañong, Marikina City',
    phone: '+63 945 381 3346',
    telHref: 'tel:+639453813346',
    hours: OFFICE_HOURS,
    mapUrl: googleMapsSearchUrl('26 Domitilla St., Provident Village, Tañong, Marikina City'),
    whatsappUrl: null,
    photoUrl: osmTileUrl(14.6327, 121.087),
    isHeadquarters: true,
  },
  {
    id: 'pampanga-branch',
    title: 'Pampanga Office',
    region: 'Central Luzon',
    address: 'B8 L1 Pagsibol Village Magalang, Brgy. San Isidro, Magalang, Pampanga',
    phone: '+63 917 704 7324',
    telHref: 'tel:+639177047324',
    hours: OFFICE_HOURS,
    mapUrl: googleMapsSearchUrl('Pagsibol Village Magalang, Brgy. San Isidro, Magalang, Pampanga'),
    whatsappUrl: null,
    photoUrl: osmTileUrl(15.2145, 120.6606),
    isHeadquarters: false,
  },
  {
    id: 'tarlac-branch',
    title: 'Tarlac Office',
    region: 'Central Luzon',
    address: 'Blk 43 Lot 12, Brentwood Residences P1, Capas, Tarlac',
    phone: '+63 917 908 8879',
    telHref: 'tel:+639179088879',
    hours: OFFICE_HOURS,
    mapUrl: googleMapsSearchUrl('Brentwood Residences, Capas, Tarlac'),
    whatsappUrl: null,
    photoUrl: osmTileUrl(15.3279, 120.5882),
    isHeadquarters: false,
  },
  {
    id: 'batangas-branch',
    title: 'Batangas Office',
    region: 'CALABARZON',
    address: '3rd Floor, Room 3, MADC Building, San Miguel, Santo Tomas, Batangas',
    phone: '+63 919 900 3341',
    telHref: 'tel:+639199003341',
    hours: OFFICE_HOURS,
    mapUrl: googleMapsSearchUrl('MADC Building, San Miguel, Santo Tomas, Batangas'),
    whatsappUrl: null,
    photoUrl: osmTileUrl(14.1079, 121.1414),
    isHeadquarters: false,
  },
  {
    id: 'bulacan-branch',
    title: 'Bulacan Office',
    region: 'Central Luzon',
    address:
      'TYK Commercial Building Unit 4, Santa Maria Bypass Rd, Brgy. Santa Clara, Santa Maria, Bulacan (beside WalterMart Sta. Maria)',
    phone: '',
    telHref: null,
    hours: OFFICE_HOURS,
    mapUrl: googleMapsSearchUrl('TYK Commercial Building, Santa Maria Bypass Rd, Santa Maria, Bulacan'),
    whatsappUrl: null,
    photoUrl: osmTileUrl(14.8195, 120.9562),
    isHeadquarters: false,
  },
  {
    id: 'cavite-branch',
    title: 'Cavite Office',
    region: 'CALABARZON',
    address: 'B301 L5, Pasinaya West Asensa, Brgy. Sabang, Naic, Cavite',
    phone: '+63 997 968 7476 / +63 917 704 7185',
    telHref: 'tel:+639979687476',
    hours: OFFICE_HOURS,
    mapUrl: googleMapsSearchUrl('Pasinaya West Asensa, Brgy. Sabang, Naic, Cavite'),
    whatsappUrl: null,
    photoUrl: osmTileUrl(14.3167, 120.7667),
    isHeadquarters: false,
  },
];

export const DEFAULT_CONTACT_CONTENT = {
  eyebrow: "Let's Talk",
  headline: 'Ready to start the conversation?',
  intro:
    "Whether you're ready to buy, thinking of selling, or exploring neighborhoods across our branches, our local advisors are here to help.",
  phone: '+63 917 320 6778',
  whatsappUrl: 'https://wa.me/639173206778',
  calendlyUrl: 'https://calendly.com',
  email: 'support@humanshelter.info',
  websiteUrl: 'https://www.humanshelter.info',
  recruitmentUrl: 'https://www.humanshelter.info/join-human-shelter',
  youtubeUrl: 'https://www.youtube.com/@humanshelterofficial',
  responseTime: `Typically replies within 2 hours during business hours (${OFFICE_HOURS})`,
  credentialsText: 'Founded 1989 · Licensed Real Estate Brokerage · PRC & DHSUD Accredited',
  testimonialQuote:
    'The team walked us through every step clearly and helped us close on our family home without any stress.',
  testimonialAuthor: 'Verified Homebuyer, Metro Manila',
  fallbackBranch: FALLBACK_BRANCHES[0],
  fallbackBranches: FALLBACK_BRANCHES,
};

export const INQUIRY_TOPICS = [
  { value: 'buying', label: 'Buying a Property', inquiryType: 'general' },
  { value: 'selling', label: 'Selling a Property', inquiryType: 'general' },
  { value: 'renting', label: 'Renting / Leasing', inquiryType: 'general' },
  { value: 'viewing', label: 'Schedule a Property Viewing', inquiryType: 'tour' },
  { value: 'general', label: 'General Question', inquiryType: 'general' },
];

export function safeHttpUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

export function safeMediaUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  return safeHttpUrl(trimmed);
}

export function toTelHref(phone) {
  if (typeof phone !== 'string') return null;
  const cleaned = phone.trim().replace(/[^\d+]/g, '');
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 7) return null;
  return `tel:${cleaned}`;
}

export function normalizeBranches(offices = []) {
  if (!Array.isArray(offices)) return [];

  return offices
    .filter((item) => item && (item.id || item.title))
    .map((office) => {
      const payload = office.payload || {};
      const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
      return {
        id: String(office.id || office.title),
        title: office.title || 'Office Branch',
        region: typeof payload.region === 'string' ? payload.region.trim() : '',
        address: typeof payload.address === 'string' ? payload.address.trim() : '',
        phone,
        telHref: toTelHref(phone),
        hours: typeof payload.hours === 'string' ? payload.hours.trim() : '',
        mapUrl: safeHttpUrl(payload.map_url),
        whatsappUrl: safeHttpUrl(payload.whatsapp_url),
        photoUrl: safeMediaUrl(office.media_url),
        isHeadquarters: Boolean(payload.is_headquarters),
      };
    })
    .sort((a, b) => Number(b.isHeadquarters) - Number(a.isHeadquarters));
}

export function extractBranchRegions(branches = []) {
  const seen = new Set();
  const regions = [];
  for (const branch of branches) {
    if (branch.region && !seen.has(branch.region)) {
      seen.add(branch.region);
      regions.push(branch.region);
    }
  }
  return regions;
}

export function buildInquiryMessage({ topicLabel, branchName, message }) {
  const lines = [];
  if (topicLabel) lines.push(`[Topic: ${topicLabel}]`);
  if (branchName) lines.push(`[Preferred Branch: ${branchName}]`);
  lines.push((message || '').trim());
  return lines.join('\n');
}
