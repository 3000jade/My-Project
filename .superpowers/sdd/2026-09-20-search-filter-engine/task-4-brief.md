### Task 4: Empty State Algorithm & Component

**Files:**
- Create: rontend/src/components/ui/FilterEmptyState.jsx
- Create: rontend/src/components/ui/FilterEmptyState.test.jsx

**Interfaces:**
- Consumes: hook's 	ightestFilter algorithm results
- Produces: <FilterEmptyState onClearFilter={...} suggestions={...} />

- [ ] **Step 1: Write the failing test**
`javascript
// frontend/src/components/ui/FilterEmptyState.test.jsx
import { render, screen } from '@testing-library/react';
import FilterEmptyState from './FilterEmptyState';
import { describe, it, expect } from 'vitest';

describe('FilterEmptyState', () => {
  it('displays the tightest filter reset button', () => {
    render(<FilterEmptyState tightestFilter={{ key: 'maxPrice', label: 'Clear price ceiling' }} onClearFilter={() => {}} suggestions={[]} />);
    expect(screen.getByText('Clear price ceiling')).toBeInTheDocument();
  });
});
`

- [ ] **Step 2: Run test to verify it fails**
Run: 
pm test FilterEmptyState
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
Build FilterEmptyState.jsx returning the "No Results" message, a button to clear the tightest filter, and iteration over suggestions chips.

- [ ] **Step 4: Run test to verify it passes**
Run: 
pm test FilterEmptyState
Expected: PASS

- [ ] **Step 5: Commit**
git add frontend/src/components/ui/FilterEmptyState.jsx frontend/src/components/ui/FilterEmptyState.test.jsx
git commit -m "feat(ui): add algorithmic empty state recovery component"
