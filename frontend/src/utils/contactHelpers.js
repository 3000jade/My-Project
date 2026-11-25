export const DEFAULT_CONTACT_CONTENT = {
  eyebrow: "Let's Talk",
  headline: 'Ready to start the conversation?',
  intro:
    "Whether you're ready to buy, thinking of selling, or exploring neighborhoods across our branches, our local advisors are here to help.",
  phone: '+63 2 8000 0000',
  whatsappUrl: 'https://wa.me/639170000000',
  calendlyUrl: 'https://calendly.com',
  email: 'hello@humanshelter.ph',
  responseTime: 'Typically replies within 2 hours during business hours (Mon–Sat, 9:00 AM – 6:00 PM)',
  credentialsText: 'Licensed Real Estate Brokerage · PRC-Accredited Advisors',
  testimonialQuote:
    'The team walked us through every step clearly and helped us close on our family home without any stress.',
  testimonialAuthor: 'Verified Homebuyer, Metro Manila',
  fallbackBranch: {
    id: 'default-hq',
    title: 'Main Advisory Office',
    region: 'Metro Manila',
    address: 'Bonifacio Global City, Taguig, Metro Manila',
    phone: '+63 2 8000 0000',
    telHref: 'tel:+63280000000',
    hours: 'Mon–Sat, 9:00 AM – 6:00 PM',
    mapUrl: null,
    whatsappUrl: null,
    photoUrl: null,
    isHeadquarters: true,
  },
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
