### Task 3: Core Filter Hook Engine

**Files:**
- Create: rontend/src/hooks/usePropertyFilterEngine.js
- Create: rontend/src/hooks/usePropertyFilterEngine.test.js

**Interfaces:**
- Produces: usePropertyFilterEngine(initialProperties)

- [ ] **Step 1: Write the failing test**
`javascript
// frontend/src/hooks/usePropertyFilterEngine.test.js
import { renderHook, act } from '@testing-library/react';
import { usePropertyFilterEngine } from './usePropertyFilterEngine';
import { describe, it, expect } from 'vitest';

describe('usePropertyFilterEngine', () => {
  it('calculates facet counts correctly', () => {
    const mockData = [{ bedrooms: 2 }, { bedrooms: 2 }, { bedrooms: 3 }];
    const { result } = renderHook(() => usePropertyFilterEngine(mockData));
    expect(result.current.facets.bedrooms['2']).toBe(2);
  });
});
`

- [ ] **Step 2: Run test to verify it fails**
Run: 
pm test usePropertyFilterEngine
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
Create usePropertyFilterEngine.js implementing local state, facet aggregations mapped by constraint keys, and basic filtering mechanics for the provided dataset.

- [ ] **Step 4: Run test to verify it passes**
Run: 
pm test usePropertyFilterEngine
Expected: PASS

- [ ] **Step 5: Commit**
git add frontend/src/hooks/
git commit -m "feat(hook): implement usePropertyFilterEngine state and facets"
