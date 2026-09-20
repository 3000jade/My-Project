import { renderHook, act } from '@testing-library/react';
import { usePropertyFilterEngine } from './usePropertyFilterEngine';
import { describe, it, expect, vi } from 'vitest';

describe('usePropertyFilterEngine', () => {
  it('calculates facet counts correctly', () => {
    const mockData = [{ bedrooms: 2, status: 'Active' }, { bedrooms: 2, status: 'Sold' }, { bedrooms: 3, status: 'Active' }];
    const { result } = renderHook(() => usePropertyFilterEngine(mockData));
    
    // Dynamic facet generation
    expect(result.current.facets.bedrooms['2']).toBe(2);
    expect(result.current.facets.status['Active']).toBe(2);
  });

  it('debounces filter changes', async () => {
    vi.useFakeTimers();
    const mockData = [{ bedrooms: 2 }];
    const { result } = renderHook(() => usePropertyFilterEngine(mockData));
    
    act(() => {
      result.current.setFilter('bedrooms', 3);
    });
    
    // Should not update immediately
    expect(result.current.debouncedFilters.bedrooms).toBeUndefined();
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    // Should update after 300ms
    expect(result.current.debouncedFilters.bedrooms).toBe(3);
    
    vi.useRealTimers();
  });
});
