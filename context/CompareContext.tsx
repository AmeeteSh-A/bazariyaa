'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface CompareState {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  max: number;
}

const CompareContext = createContext<CompareState | null>(null);
const MAX = 4;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  const add = useCallback((id: string) => setIds(s => (s.includes(id) || s.length >= MAX ? s : [...s, id])), []);
  const remove = useCallback((id: string) => setIds(s => s.filter(x => x !== id)), []);
  const toggle = useCallback((id: string) => setIds(s => (s.includes(id) ? s.filter(x => x !== id) : s.length >= MAX ? s : [...s, id])), []);
  const clear = useCallback(() => setIds([]), []);

  const value = useMemo<CompareState>(
    () => ({ ids, has: (id: string) => ids.includes(id), toggle, add, remove, clear, max: MAX }),
    [ids, toggle, add, remove, clear],
  );
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareState {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used inside <CompareProvider>');
  return ctx;
}
