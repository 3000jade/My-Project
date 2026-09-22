### Task 1: Update Shared Contracts & Mock Data

**Files:**
- Modify: shared/types/property.ts
- Modify: rontend/src/mockData/mockProperties.js

**Interfaces:**
- Produces: Enhanced PropertyItem type.
- Produces: Enriched mockProperties list with Philippine market fields.

- [ ] **Step 1: Write the failing type/mock data tests**
(Not strictly tested via runner since it's type definition and mock data, but we'll add a quick sanity test for the mock data structure).
`javascript
// frontend/src/mockData/mockProperties.test.js
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
`

- [ ] **Step 2: Run test to verify it fails**
Run: 
pm test mockProperties.test.js
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
Update shared/types/property.ts to include:
`	ypescript
export interface PropertyItem {
  // ... existing fields ...
  transactionType?: 'For Sale' | 'For Rent' | 'Pre-Selling';
  propertySubClass?: string;
  furnishing?: 'Fully Furnished' | 'Semi-Furnished' | 'Bare / Unfurnished';
  floorLevel?: 'Low' | 'Mid' | 'High' | 'Penthouse';
  financingTerms?: string[];
  communityRules?: string[];
  tenureType?: 'Perpetual / Freehold' | 'Leasehold' | 'Clean Title';
}
`
Update rontend/src/mockData/mockProperties.js to seed these fields across the first few objects.

- [ ] **Step 4: Run test to verify it passes**
Run: 
pm test mockProperties.test.js
Expected: PASS

- [ ] **Step 5: Commit**
git add shared/types/property.ts frontend/src/mockData/mockProperties.js frontend/src/mockData/mockProperties.test.js
git commit -m "feat(data): extend property schema with market niches"
