import { describe, it, expect } from 'vitest';
import { mockProperties } from './mockProperties';

describe('mockProperties data structure', () => {
  it('contains extended Philippine market fields', () => {
    const prop = mockProperties[0];
    expect(prop).toHaveProperty('transactionType');
    expect(prop).toHaveProperty('propertySubClass');
    expect(prop).toHaveProperty('financingTerms');
  });
});
