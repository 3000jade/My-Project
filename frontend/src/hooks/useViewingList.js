import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'cp_viewing_list';

export function useViewingList() {
  const [viewingList, setViewingList] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(viewingList));
      window.dispatchEvent(new CustomEvent('viewing-list-updated', { detail: { count: viewingList.length } }));
    } catch {
      // ignore storage write errors
    }
  }, [viewingList]);

  const isInViewingList = useCallback((id) => {
    return viewingList.some(item => item.id === id);
  }, [viewingList]);

  const toggleViewingList = useCallback((property) => {
    if (!property || !property.id) return;
    setViewingList(prev => {
      const exists = prev.some(item => item.id === property.id);
      if (exists) {
        return prev.filter(item => item.id !== property.id);
      } else {
        return [...prev, property];
      }
    });
  }, []);

  return {
    viewingList,
    viewingCount: viewingList.length,
    isInViewingList,
    toggleViewingList
  };
}

export default useViewingList;
