// src/context/PersonaContext.tsx
import * as React from 'react';

type PersonaContextValue = {
  selectedPersonaId: string;
  setSelectedPersonaId: (id: string) => void;
};

const PersonaContext = React.createContext<PersonaContextValue | undefined>(undefined);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [selectedPersonaId, setSelectedPersonaId] = React.useState<string>('coach');

  const value = React.useMemo(() => ({ selectedPersonaId, setSelectedPersonaId }), [selectedPersonaId]);
  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersonaContext(): PersonaContextValue {
  const ctx = React.useContext(PersonaContext);
  if (!ctx) throw new Error('usePersonaContext must be used within a PersonaProvider');
  return ctx;
}



