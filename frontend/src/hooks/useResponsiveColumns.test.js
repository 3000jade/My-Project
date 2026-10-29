import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useResponsiveColumns, {
  getViewportTier,
  getDefaultColumnsForTier,
  VIEWPORT_BREAKPOINTS
} from './useResponsiveColumns';

const MOCK_COLUMNS = [
  { id: 'property', label: 'Property', isLocked: true, tiers: ['mobile', 'tablet', 'desktop'] },
  { id: 'location', label: 'Location', tiers: ['tablet', 'desktop'] },
  { id: 'property_type', label: 'Property Type', tiers: ['tablet', 'desktop'] },
  { id: 'specs', label: 'Specs', tiers: ['desktop'] },
  { id: 'price', label: 'Price', tiers: ['mobile', 'tablet', 'desktop'] },
  { id: 'status', label: 'Status', tiers: ['mobile', 'tablet', 'desktop'] },
  { id: 'date_added', label: 'Date Added', tiers: ['desktop'] },
  { id: 'actions', label: 'Actions', isLocked: true, tiers: ['mobile', 'tablet', 'desktop'] },
];

describe('useResponsiveColumns Utility Functions', () => {
  it('correctly categorizes viewport tiers', () => {
    expect(getViewportTier(375)).toBe('mobile');
    expect(getViewportTier(640)).toBe('mobile');
    expect(getViewportTier(767)).toBe('mobile');
    expect(getViewportTier(768)).toBe('tablet');
    expect(getViewportTier(900)).toBe('tablet');
    expect(getViewportTier(1023)).toBe('tablet');
    expect(getViewportTier(1024)).toBe('desktop');
    expect(getViewportTier(1440)).toBe('desktop');
  });

  it('computes default columns for mobile tier (4 columns)', () => {
    const mobileCols = getDefaultColumnsForTier(MOCK_COLUMNS, 'mobile');
    expect(mobileCols).toEqual(['property', 'price', 'status', 'actions']);
    expect(mobileCols).toHaveLength(4);
  });

  it('computes default columns for tablet tier (6 columns)', () => {
    const tabletCols = getDefaultColumnsForTier(MOCK_COLUMNS, 'tablet');
    expect(tabletCols).toEqual(['property', 'location', 'property_type', 'price', 'status', 'actions']);
    expect(tabletCols).toHaveLength(6);
  });

  it('computes default columns for desktop tier (8 columns)', () => {
    const desktopCols = getDefaultColumnsForTier(MOCK_COLUMNS, 'desktop');
    expect(desktopCols).toEqual([
      'property',
      'location',
      'property_type',
      'specs',
      'price',
      'status',
      'date_added',
      'actions'
    ]);
    expect(desktopCols).toHaveLength(8);
  });
});

describe('useResponsiveColumns Hook', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
    vi.useRealTimers();
  });

  it('initializes with mobile default columns when window width is 375px', () => {
    window.innerWidth = 375;
    const { result } = renderHook(() =>
      useResponsiveColumns({
        availableColumns: MOCK_COLUMNS,
        storageKey: 'test_columns_key'
      })
    );

    expect(result.current.currentTier).toBe('mobile');
    expect(result.current.visibleColumns).toEqual(['property', 'price', 'status', 'actions']);
    expect(result.current.hasCustomPreference).toBe(false);
  });

  it('initializes with tablet default columns when window width is 800px', () => {
    window.innerWidth = 800;
    const { result } = renderHook(() =>
      useResponsiveColumns({
        availableColumns: MOCK_COLUMNS,
        storageKey: 'test_columns_key'
      })
    );

    expect(result.current.currentTier).toBe('tablet');
    expect(result.current.visibleColumns).toEqual(['property', 'location', 'property_type', 'price', 'status', 'actions']);
    expect(result.current.hasCustomPreference).toBe(false);
  });

  it('initializes with desktop default columns when window width is 1280px', () => {
    window.innerWidth = 1280;
    const { result } = renderHook(() =>
      useResponsiveColumns({
        availableColumns: MOCK_COLUMNS,
        storageKey: 'test_columns_key'
      })
    );

    expect(result.current.currentTier).toBe('desktop');
    expect(result.current.visibleColumns).toHaveLength(8);
    expect(result.current.hasCustomPreference).toBe(false);
  });

  it('adapts columns automatically on window resize if no custom preference is set', () => {
    window.innerWidth = 1280;
    const { result } = renderHook(() =>
      useResponsiveColumns({
        availableColumns: MOCK_COLUMNS,
        storageKey: 'test_columns_key'
      })
    );

    expect(result.current.currentTier).toBe('desktop');
    expect(result.current.visibleColumns).toHaveLength(8);

    // Simulate resizing to mobile
    act(() => {
      window.innerWidth = 400;
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(200);
    });

    expect(result.current.currentTier).toBe('mobile');
    expect(result.current.visibleColumns).toEqual(['property', 'price', 'status', 'actions']);
  });

  it('preserves user custom column selection when setVisibleColumns is called and prevents automatic resize override', () => {
    window.innerWidth = 1280;
    const { result } = renderHook(() =>
      useResponsiveColumns({
        availableColumns: MOCK_COLUMNS,
        storageKey: 'test_columns_key'
      })
    );

    // User explicitly selects custom columns (e.g. only property, specs, actions)
    act(() => {
      result.current.setVisibleColumns(['property', 'specs']);
    });

    // Locked column 'actions' is automatically preserved
    expect(result.current.visibleColumns).toEqual(['property', 'specs', 'actions']);
    expect(result.current.hasCustomPreference).toBe(true);
    expect(JSON.parse(localStorage.getItem('test_columns_key'))).toEqual(['property', 'specs', 'actions']);

    // Resize to mobile - custom preference should NOT be overwritten
    act(() => {
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(200);
    });

    expect(result.current.visibleColumns).toEqual(['property', 'specs', 'actions']);
  });

  it('resets to device default when resetToDeviceDefault is called', () => {
    window.innerWidth = 375; // mobile
    const { result } = renderHook(() =>
      useResponsiveColumns({
        availableColumns: MOCK_COLUMNS,
        storageKey: 'test_columns_key'
      })
    );

    act(() => {
      result.current.setVisibleColumns(['property', 'location', 'specs']);
    });
    expect(result.current.hasCustomPreference).toBe(true);

    act(() => {
      result.current.resetToDeviceDefault();
    });

    expect(result.current.hasCustomPreference).toBe(false);
    expect(result.current.visibleColumns).toEqual(['property', 'price', 'status', 'actions']);
    expect(localStorage.getItem('test_columns_key')).toBeNull();
  });
});
