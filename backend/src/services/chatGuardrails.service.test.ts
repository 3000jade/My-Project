import { describe, it, expect } from 'vitest';
import {
  buildFollowUpSuggestions,
  evaluateChatGuardrails,
  isTagalogOrTaglish,
} from './chatGuardrails.service';
import type { ChatPropertyCard, ChatPropertyDetail } from '../types/chat.types';

function makeCard(id: string, title: string, city = 'Makati'): ChatPropertyCard {
  return {
    id,
    title,
    city,
    price: 12000000,
    formattedPrice: 'PHP 12,000,000',
    propertyType: 'Condominium',
    transactionType: 'For Sale',
    bedrooms: 2,
    bathrooms: 2,
    floorArea: 85,
    lotArea: null,
    parking: 1,
    mainImage: null,
    status: 'Published',
  };
}

function makeDetail(id = 'prop-active', title = 'The Residences Makati', city = 'Makati'): ChatPropertyDetail {
  return {
    ...makeCard(id, title, city),
    address: '123 Ayala Ave',
    subdivisionName: null,
    buildingName: 'The Residences',
    associationFee: null,
    associationFeeFrequency: null,
    features: ['Swimming Pool'],
    publicRemarks: null,
    coordinates: null,
  };
}

describe('evaluateChatGuardrails', () => {
  it('triggers handoff for viewing and site-visit requests in English and Tagalog/Taglish', () => {
    expect(evaluateChatGuardrails({ userQuery: 'Can we schedule a viewing this Saturday?' })).toEqual({
      suggestHandoff: true,
      handoffReason: 'viewing_request',
    });
    expect(evaluateChatGuardrails({ userQuery: 'Pwede ba kami mag-tripping bukas?' })).toEqual({
      suggestHandoff: true,
      handoffReason: 'viewing_request',
    });
  });

  it('triggers handoff for price negotiation and discount requests', () => {
    expect(evaluateChatGuardrails({ userQuery: 'Can you give me a 10% discount or last price?' })).toEqual({
      suggestHandoff: true,
      handoffReason: 'price_negotiation',
    });
    expect(evaluateChatGuardrails({ userQuery: 'Pwede pa ba tawad sa presyo nito?' })).toEqual({
      suggestHandoff: true,
      handoffReason: 'price_negotiation',
    });
  });

  it('triggers handoff for ROI, future value, flood/crime safety, and title/legal/loan guarantees', () => {
    expect(evaluateChatGuardrails({ userQuery: 'Will this condo double in value in 5 years?' }).handoffReason).toBe(
      'investment_roi'
    );
    expect(evaluateChatGuardrails({ userQuery: 'Binabaha ba sa subdivision na ito pag bagyo?' }).handoffReason).toBe(
      'safety_or_flood'
    );
    expect(evaluateChatGuardrails({ userQuery: 'Is the area safe from crime?' }).handoffReason).toBe(
      'safety_or_flood'
    );
    expect(evaluateChatGuardrails({ userQuery: 'Is the TCT title 100% clean and how much exact CGT?' }).handoffReason).toBe(
      'legal_tax_or_loan'
    );
    expect(evaluateChatGuardrails({ userQuery: 'Sure ba ma-approve Pag-IBIG loan ko dito?' }).handoffReason).toBe(
      'legal_tax_or_loan'
    );
  });

  it('triggers handoff when a property search returned zero matches', () => {
    expect(
      evaluateChatGuardrails({
        userQuery: 'Show me 5-bedroom villas in Palawan under 5M',
        hadEmptySearch: true,
      })
    ).toEqual({
      suggestHandoff: true,
      handoffReason: 'no_matches',
    });
  });

  it('does NOT trigger handoff on normal browsing or feature questions', () => {
    expect(evaluateChatGuardrails({ userQuery: 'Show me 2-bedroom condos in Makati under 20M' })).toEqual({
      suggestHandoff: false,
    });
    expect(evaluateChatGuardrails({ userQuery: 'Does this house have a swimming pool?' })).toEqual({
      suggestHandoff: false,
    });
  });
});

describe('isTagalogOrTaglish', () => {
  it('detects Tagalog and Taglish queries and ignores plain English', () => {
    expect(isTagalogOrTaglish('May 3-bedroom bahay ba kayo sa Alabang?')).toBe(true);
    expect(isTagalogOrTaglish('Pwede ba mag-viewing bukas sa Makati?')).toBe(true);
    expect(isTagalogOrTaglish('Show me 2-bedroom condos in Makati under 20M')).toBe(false);
    expect(isTagalogOrTaglish('')).toBe(false);
  });
});

describe('buildFollowUpSuggestions', () => {
  it('returns 2-3 English chips including a comparison suggestion when 2+ cards are returned', () => {
    const suggestions = buildFollowUpSuggestions({
      userQuery: 'Show me 2-bedroom condos in Makati',
      cards: [makeCard('1', 'Makati Prime Suite'), makeCard('2', 'Ayala Tower Unit')],
    });

    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.length).toBeLessThanOrEqual(3);
    expect(suggestions.some((s) => /compare/i.test(s))).toBe(true);
  });

  it('returns 2-3 Taglish chips when the user asks in Tagalog or Taglish', () => {
    const suggestions = buildFollowUpSuggestions({
      userQuery: 'May 3-bedroom bahay ba kayo sa Alabang?',
      cards: [makeCard('1', 'Alabang Hills Home', 'Muntinlupa'), makeCard('2', 'Ayala Alabang House', 'Muntinlupa')],
    });

    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.length).toBeLessThanOrEqual(3);
    expect(suggestions.some((s) => /\b(ikukumpara|malapit|presyo|viewing|bahay|ito|sa|ba|ang|pa|mga)\b/i.test(s))).toBe(
      true
    );
  });

  it('includes "What\'s nearby this property?" when viewing an active listing with no cards returned', () => {
    const suggestions = buildFollowUpSuggestions({
      userQuery: 'Tell me more about this listing',
      activeProperty: makeDetail(),
      cards: [],
    });

    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.length).toBeLessThanOrEqual(3);
    expect(suggestions).toContain("What's nearby this property?");
  });

  it('returns broader-search and featured suggestions when handoffReason is no_matches', () => {
    const suggestions = buildFollowUpSuggestions({
      userQuery: 'Show me 5-bedroom castles in Batanes under 1M',
      cards: [],
      suggestHandoff: true,
      handoffReason: 'no_matches',
    });

    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.length).toBeLessThanOrEqual(3);
    expect(suggestions.some((s) => /(broad|other|featured|budget|similar|city|cities)/i.test(s))).toBe(true);
  });

  it('returns 2-3 contextual next-step chips for comparison and nearby results', () => {
    const comparisonSuggestions = buildFollowUpSuggestions({
      userQuery: 'Compare these two condos',
      comparison: {
        properties: [
          { id: '1', title: 'Makati Prime Suite', city: 'Makati', formattedPrice: 'PHP 12,000,000' },
          { id: '2', title: 'BGC Horizon Flat', city: 'Taguig', formattedPrice: 'PHP 14,500,000' },
        ],
        rows: [{ label: 'Price', values: ['PHP 12,000,000', 'PHP 14,500,000'] }],
      },
    });

    expect(comparisonSuggestions.length).toBeGreaterThanOrEqual(2);
    expect(comparisonSuggestions.length).toBeLessThanOrEqual(3);

    const nearbySuggestions = buildFollowUpSuggestions({
      userQuery: "What's nearby this home?",
      activeProperty: makeDetail(),
      nearby: {
        propertyId: 'prop-active',
        propertyTitle: 'The Residences Makati',
        landmarks: [{ category: 'mall', label: 'Greenbelt (0.5 km)' }],
        commutes: [{ destinationName: 'Makati CBD', distanceText: '1.2 km', durationText: '5 mins' }],
      },
    });

    expect(nearbySuggestions.length).toBeGreaterThanOrEqual(2);
    expect(nearbySuggestions.length).toBeLessThanOrEqual(3);
  });
});
