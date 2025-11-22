import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useHouseholdApi } from '../hooks/useHouseholdApi';
import { useAuth } from './AuthContext';

type HouseholdContextType = ReturnType<typeof useHouseholdApi>;

const HouseholdContext = createContext<HouseholdContextType | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const householdState = useHouseholdApi();
  const { isAuthenticated } = useAuth();

  // Load households when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      householdState.loadHouseholds().then(households => {
        // Auto-load first household if available
        if (households.length > 0 && !householdState.household) {
          householdState.loadHousehold(households[0].id);
        }
      });
    }
  }, [isAuthenticated]);

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
