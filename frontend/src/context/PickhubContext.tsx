// src/context/PickhubContext.tsx
import * as React from 'react';

export type PickhubContextValue = {
  selectedPersonaId: string;
  setSelectedPersonaId: (id: string) => void;
  // Extend here as app state grows (e.g., selectedWeek, feature flags, etc.)
};

const PickhubContext = React.createContext<PickhubContextValue | undefined>(undefined);

export function PickhubProvider({ children }: { children: React.ReactNode }) {
  const [selectedPersonaId, setSelectedPersonaId] = React.useState<string>('coach');

  const value = React.useMemo(
    () => ({ selectedPersonaId, setSelectedPersonaId }),
    [selectedPersonaId]
  );

  return <PickhubContext.Provider value={value}>{children}</PickhubContext.Provider>;
}

export function usePickhubContext(): PickhubContextValue {
  const ctx = React.useContext(PickhubContext);
  if (!ctx) throw new Error('usePickhubContext must be used within a PickhubProvider');
  return ctx;
}



