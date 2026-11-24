import type { ChatHandoffReason } from '../types/chat.types';

export interface ChatGuardrailInput {
  userQuery: string;
  hadEmptySearch?: boolean;
}

export interface ChatGuardrailResult {
  suggestHandoff: boolean;
  handoffReason?: ChatHandoffReason;
}

const VIEWING_PATTERNS: RegExp[] = [
  /\b(viewing|site\s*visit|tour|ocular|tripping|schedule\s+a\s+visit|book\s+a\s+(viewing|visit|tour)|visit\s+the\s+(property|house|condo|unit))\b/i,
  /\b(mag-?tripping|pa-?schedule|pasyal|tingnan\s+ang\s+(bahay|condo|unit|property))\b/i,
];

const NEGOTIATION_PATTERNS: RegExp[] = [
  /\b(discount|last\s*price|best\s*price|lowest\s*price|negotiate|negotiable|haggle|cash\s*discount|off-?market|promo\s*price|less\s*\d+%?)\b/i,
  /\b(tawad|bawas\s+sa\s+presyo|may\s+bawas|pinakamababang\s+presyo|huling\s+presyo)\b/i,
];

const INVESTMENT_ROI_PATTERNS: RegExp[] = [
  /\b(roi|return\s+on\s+investment|double\s+in\s+value|appreciat(e|ion)|future\s+(value|price)|resale\s+value|airbnb\s+(income|earnings|return)|rental\s+(yield|income|return)|guaranteed\s+(return|profit|income))\b/i,
  /\b(tataas\s+ba\s+ang\s+presyo|magkano\s+kikitain|kita\s+sa\s+(upa|rent|airbnb))\b/i,
];

const SAFETY_FLOOD_PATTERNS: RegExp[] = [
  /\b(flood|flooding|flood-?prone|typhoon|baha|binabaha|bumabaha|bahain|crime|crime\s*rate|safe\s+neighborhood|safe\s+area|ligtas\s+ba|earthquake|fault\s*line|landslide)\b/i,
];

const LEGAL_TAX_LOAN_PATTERNS: RegExp[] = [
  /\b(clean\s+title|tct|cct|title\s+status|encumbrance|tax\s+dec(laration)?|capital\s+gains\s+tax|cgt|dst|documentary\s+stamp|transfer\s+tax|notarial|deed\s+of\s+sale|contract\s+to\s+sell|pag-?ibig\s+loan|bank\s+loan|loan\s+approval|pre-?approv(al|ed)|mortgage\s+approval|monthly\s+amortization)\b/i,
  /\b(malinis\s+ba\s+ang\s+titulo|titulo|sure\s+ba\s+ma-?approve|ma-?approve\s+(ba\s+)?ang\s+loan|bayad\s+sa\s+buwis)\b/i,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Deterministic server-side guardrail detector for English & Tagalog/Taglish queries.
 * Ensures the UI surfaces a one-click "Connect to Licensed Agent" CTA reliably on
 * viewing requests, price haggling, strict "never guess" topics, and empty searches.
 */
export function evaluateChatGuardrails(input: ChatGuardrailInput): ChatGuardrailResult {
  const query = String(input.userQuery || '').trim();

  if (query) {
    if (matchesAny(query, VIEWING_PATTERNS)) {
      return { suggestHandoff: true, handoffReason: 'viewing_request' };
    }
    if (matchesAny(query, NEGOTIATION_PATTERNS)) {
      return { suggestHandoff: true, handoffReason: 'price_negotiation' };
    }
    if (matchesAny(query, INVESTMENT_ROI_PATTERNS)) {
      return { suggestHandoff: true, handoffReason: 'investment_roi' };
    }
    if (matchesAny(query, SAFETY_FLOOD_PATTERNS)) {
      return { suggestHandoff: true, handoffReason: 'safety_or_flood' };
    }
    if (matchesAny(query, LEGAL_TAX_LOAN_PATTERNS)) {
      return { suggestHandoff: true, handoffReason: 'legal_tax_or_loan' };
    }
  }

  if (input.hadEmptySearch) {
    return { suggestHandoff: true, handoffReason: 'no_matches' };
  }

  return { suggestHandoff: false };
}
