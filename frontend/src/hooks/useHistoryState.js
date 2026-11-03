import { useState, useCallback, useRef } from 'react';

/**
 * useHistoryState - Lightweight, high-performance undo/redo hook for immutable state.
 *
 * @param {*} initialPresent - Initial state value
 * @param {number} maxDepth - Max number of history snapshots to keep (default 25)
 * @returns {{
 *   state: *,
 *   setState: (valueOrFn: *) => void,
 *   undo: () => void,
 *   redo: () => void,
 *   canUndo: boolean,
 *   canRedo: boolean,
 *   clearHistory: () => void
 * }}
 */
export function useHistoryState(initialPresent, maxDepth = 25) {
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initialPresent);
  const [future, setFuture] = useState([]);

  // Ref to present to guarantee atomic transitions without stale closures
  const presentRef = useRef(present);
  presentRef.current = present;

  const setState = useCallback((newValOrFn) => {
    setPresent((currentPresent) => {
      const nextPresent = typeof newValOrFn === 'function' ? newValOrFn(currentPresent) : newValOrFn;

      // Skip pushing to past if identity/value hasn't changed
      if (nextPresent === currentPresent) return currentPresent;

      setPast((prevPast) => {
        const nextPast = [...prevPast, currentPresent];
        return nextPast.length > maxDepth ? nextPast.slice(nextPast.length - maxDepth) : nextPast;
      });
      setFuture([]); // New state branch clears future redo queue

      return nextPresent;
    });
  }, [maxDepth]);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;

      const previous = prevPast[prevPast.length - 1];
      const nextPast = prevPast.slice(0, prevPast.length - 1);

      setFuture((prevFuture) => [presentRef.current, ...prevFuture]);
      setPresent(previous);

      return nextPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;

      const next = prevFuture[0];
      const nextFuture = prevFuture.slice(1);

      setPast((prevPast) => [...prevPast, presentRef.current]);
      setPresent(next);

      return nextFuture;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    state: present,
    setState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clearHistory,
  };
}
