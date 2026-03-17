'use client';

import React, { createContext, useContext, useState } from 'react';

interface ModeContextType {
  isModeOpen: boolean;
  openMode: () => void;
  closeMode: () => void;
}

const ModeContext = createContext<ModeContextType | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [isModeOpen, setIsModeOpen] = useState(false);

  return (
    <ModeContext.Provider value={{
      isModeOpen,
      openMode: () => setIsModeOpen(true),
      closeMode: () => setIsModeOpen(false),
    }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useModeContext() {
  const context = useContext(ModeContext);
  if (!context) throw new Error('useModeContext must be used within ModeProvider');
  return context;
}
