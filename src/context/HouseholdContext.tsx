import { createContext, useContext, ReactNode } from 'react';
import { useHousehold } from '../hooks/useHousehold';

type HouseholdContextType = ReturnType<typeof useHousehold>;

const HouseholdContext = createContext<HouseholdContextType | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const householdState = useHousehold();

  return (
    <HouseholdContext.Provider value={householdState}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHouseholdContext() {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error('useHouseholdContext must be used within a HouseholdProvider');
  }
  return context;
}
