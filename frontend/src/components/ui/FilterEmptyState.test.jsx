import { render, screen, fireEvent } from '@testing-library/react';
import FilterEmptyState from './FilterEmptyState';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

describe('FilterEmptyState', () => {
  it('displays the tightest filter reset button', () => {
    const handleClear = vi.fn();
    render(<FilterEmptyState tightestFilter={{ key: 'maxPrice', label: 'Clear price ceiling' }} onClearFilter={handleClear} suggestions={[]} />);
    expect(screen.getByText('Clear price ceiling')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Clear price ceiling'));
    expect(handleClear).toHaveBeenCalledWith('maxPrice');
  });

  it('displays suggestions', () => {
    render(<FilterEmptyState tightestFilter={null} onClearFilter={() => {}} suggestions={[{ key: 'brand', label: 'Try Apple' }]} />);
    expect(screen.getByText('Try Apple')).toBeInTheDocument();
  });
});
