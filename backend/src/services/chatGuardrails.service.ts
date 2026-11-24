import type {
  ChatComparisonTable,
  ChatHandoffReason,
  ChatNearbySummary,
  ChatPropertyCard,
  ChatPropertyDetail,
} from '../types/chat.types';

export interface ChatGuardrailInput {
  userQuery: string;
  hadEmptySearch?: boolean;
}

export interface ChatGuardrailResult {
  suggestHandoff: boolean;
  handoffReason?: ChatHandoffReason;
}

export interface ChatFollowUpInput {
  userQuery: string;
  activeProperty?: ChatPropertyDetail | ChatPropertyCard | null;
  cards?: ChatPropertyCard[];
  comparison?: ChatComparisonTable;
  nearby?: ChatNearbySummary;
  suggestHandoff?: boolean;
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

const STRONG_TAGALOG_REGEX =
  /\b(bahay|lupa|magkano|pwede|puwede|meron|mayroon|kayo|ninyo|niyo|namin|kami|po|opo|saan|paano|kailan|ilang|malapit|dito|riyan|doon|yung|ung|mga|tawad|baha|binabaha|bumabaha|bahain|ligtas|titulo|buwis|kikitain|tataas|tripping|pasyal|tingnan|naghahanap|hanap|ikukumpara|ikumpara|kumpara|bukas|presyo|wala|naman|kasi|kailangan|gusto)\b/i;

const LIGHT_TAGALOG_REGEX = /\b(ba|ang|ng|sa|ito|iyan|iyon|na|pa|may)\b/gi;

/**
 * Detects whether a visitor query is written in Tagalog or Taglish so follow-up
 * chips match the visitor's language without false-triggering on plain English.
 */
export function isTagalogOrTaglish(text: string): boolean {
  const normalized = String(text || '').trim();
  if (!normalized) {
    return false;
  }
  if (STRONG_TAGALOG_REGEX.test(normalized)) {
    return true;
  }
  const lightMatches = normalized.match(LIGHT_TAGALOG_REGEX);
  return (lightMatches?.length ?? 0) >= 2;
}

function finalizeSuggestions(candidates: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const item of candidates) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(trimmed);
    }
    if (unique.length === 3) break;
  }

  return unique;
}

/**
 * Builds 2-3 context-aware, visitor-safe follow-up suggestion chips tailored
 * to the current results (cards, comparison, nearby summary, active listing,
 * or empty search) and matching English or Tagalog/Taglish queries.
 */
export function buildFollowUpSuggestions(input: ChatFollowUpInput): string[] {
  const taglish = isTagalogOrTaglish(input.userQuery);
  const cards = input.cards ?? [];
  const hasComparison = (input.comparison?.properties?.length ?? 0) >= 2;

  if (input.handoffReason === 'no_matches') {
    return finalizeSuggestions(
      taglish
        ? [
            'Maghanap sa mga kalapit na lugar',
            'Ipakita ang mga featured properties',
            'Lawakan ang budget o bilang ng kwarto',
          ]
        : [
            'Broaden search to nearby cities',
            'Show featured properties instead',
            'Adjust budget or bedroom count',
          ]
    );
  }

  if (hasComparison) {
    return finalizeSuggestions(
      taglish
        ? [
            'Alin ang mas malapit sa schools at malls?',
            'Magpa-schedule ng viewing sa napili ko',
            'Magpakita pa ng katulad na properties',
          ]
        : [
            'Which one is closer to schools and malls?',
            'Request a viewing for my top pick',
            'Show similar properties in this price range',
          ]
    );
  }

  if (input.nearby) {
    return finalizeSuggestions(
      taglish
        ? [
            'Magkano ang association dues at fees?',
            'Ikumpara ito sa iba pang kalapit na bahay',
            'Pwede ba magpa-schedule ng viewing dito?',
          ]
        : [
            'Are there association dues or fees?',
            'Compare this with similar nearby homes',
            'Schedule a viewing for this property',
          ]
    );
  }

  if (cards.length >= 2) {
    return finalizeSuggestions(
      taglish
        ? [
            'Ikumpara ang top 2 properties side by side',
            'Ano ang malapit sa unang property?',
            'I-filter ayon sa presyo o ibang lugar',
          ]
        : [
            'Compare the top 2 properties side by side',
            "What's nearby the first property?",
            'Filter by a lower price or different city',
          ]
    );
  }

  if (cards.length === 1) {
    return finalizeSuggestions(
      taglish
        ? [
            'Ano ang malapit sa property na ito?',
            'Magpakita pa ng katulad nito sa lugar',
            'Pwede ba magpa-schedule ng viewing dito?',
          ]
        : [
            "What's nearby this property?",
            'Show similar properties in this city',
            'Schedule a viewing for this property',
          ]
    );
  }

  if (input.activeProperty) {
    return finalizeSuggestions(
      taglish
        ? [
            'Ano ang malapit sa property na ito?',
            'Magpakita ng iba pang listings sa lugar',
            'Pwede ba magpa-schedule ng viewing dito?',
          ]
        : [
            "What's nearby this property?",
            'Show similar properties in this city',
            'How do I schedule a viewing?',
          ]
    );
  }

  return finalizeSuggestions(
    taglish
      ? [
          'Ipakita ang mga featured properties',
          'Maghanap ng 2-bedroom condo sa Makati',
          'Maghanap ng bahay at lupa under 15M',
        ]
      : [
          'Show featured homes for sale',
          'Find 2-bedroom condos in Makati',
          'Search houses and lots under 15M',
        ]
  );
}
