import { describe, it, expect } from 'vitest';
import { evaluateChatGuardrails } from './chatGuardrails.service';

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
