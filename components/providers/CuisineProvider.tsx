'use client';

import React, { createContext, useContext, useState } from 'react';

export type SortOption = 'relevance' | 'rating' | 'distance';

interface CuisineContextType {
  selectedCuisine: string;
  setSelectedCuisine: (cuisine: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
}

const CuisineContext = createContext<CuisineContextType | null>(null);

export function CuisineProvider({ children }: { children: React.ReactNode }) {
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  return (
    <CuisineContext.Provider value={{ selectedCuisine, setSelectedCuisine, sortBy, setSortBy }}>
      {children}
    </CuisineContext.Provider>
  );
}

export function useCuisine() {
  const ctx = useContext(CuisineContext);
  if (!ctx) throw new Error('useCuisine must be used within CuisineProvider');
  return ctx;
}
