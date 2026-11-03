import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistoryState } from './useHistoryState';

describe('useHistoryState', () => {
  it('initializes with given present value and empty history', () => {
    const { result } = renderHook(() => useHistoryState([1, 2, 3]));
    expect(result.current.state).toEqual([1, 2, 3]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('pushes to past when setState is called and updates canUndo', () => {
    const { result } = renderHook(() => useHistoryState([]));

    act(() => {
      result.current.setState([{ id: 'lot-1' }]);
    });

    expect(result.current.state).toEqual([{ id: 'lot-1' }]);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('undoes back to previous state and enables redo', () => {
    const { result } = renderHook(() => useHistoryState([]));

    act(() => {
      result.current.setState([{ id: 'lot-1' }]);
    });
    act(() => {
      result.current.setState([{ id: 'lot-1' }, { id: 'lot-2' }]);
    });

    expect(result.current.state.length).toBe(2);

    act(() => {
      result.current.undo();
    });

    expect(result.current.state).toEqual([{ id: 'lot-1' }]);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.undo();
    });

    expect(result.current.state).toEqual([]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redoes forward to future state', () => {
    const { result } = renderHook(() => useHistoryState([]));

    act(() => {
      result.current.setState([{ id: 'lot-1' }]);
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toEqual([]);

    act(() => {
      result.current.redo();
    });
    expect(result.current.state).toEqual([{ id: 'lot-1' }]);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('clears future queue when a new action is performed after undo', () => {
    const { result } = renderHook(() => useHistoryState([]));

    act(() => {
      result.current.setState([{ id: 'lot-1' }]);
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.setState([{ id: 'lot-alt' }]);
    });
    expect(result.current.state).toEqual([{ id: 'lot-alt' }]);
    expect(result.current.canRedo).toBe(false);
  });

  it('caps history stack at maxDepth', () => {
    const { result } = renderHook(() => useHistoryState(0, 3));

    act(() => result.current.setState(1));
    act(() => result.current.setState(2));
    act(() => result.current.setState(3));
    act(() => result.current.setState(4));

    expect(result.current.state).toBe(4);

    act(() => result.current.undo());
    expect(result.current.state).toBe(3);
    act(() => result.current.undo());
    expect(result.current.state).toBe(2);
    act(() => result.current.undo());
    expect(result.current.state).toBe(1);

    // Can't undo further because maxDepth=3 dropped state 0
    expect(result.current.canUndo).toBe(false);
  });
});
