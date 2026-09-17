import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useViewingList } from './useViewingList';

describe('useViewingList', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty viewing list', () => {
    const { result } = renderHook(() => useViewingList());
    expect(result.current.viewingCount).toBe(0);
    expect(result.current.isInViewingList('cmtdur9ap00011041l5curjy2')).toBe(false);
  });

  it('adds and toggles property in viewing list', () => {
    const { result } = renderHook(() => useViewingList());
    const mockProp = { id: 'cmtdur9ap00011041l5curjy2', title: 'Urban Deca Homes 2BR' };

    act(() => {
      result.current.toggleViewingList(mockProp);
    });

    expect(result.current.isInViewingList('cmtdur9ap00011041l5curjy2')).toBe(true);
    expect(result.current.viewingCount).toBe(1);

    act(() => {
      result.current.toggleViewingList(mockProp);
    });

    expect(result.current.isInViewingList('cmtdur9ap00011041l5curjy2')).toBe(false);
    expect(result.current.viewingCount).toBe(0);
  });
});
