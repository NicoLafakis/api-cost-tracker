import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HouseholdProvider } from './context/HouseholdContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { RentCalculator } from './pages/RentCalculator';
import { Expenses } from './pages/Expenses';
import { Settlement } from './pages/Settlement';
import { Settings } from './pages/Settings';
import { Setup } from './pages/Setup';
import { Analytics } from './pages/Analytics';
import { AgreementBuilder } from './pages/AgreementBuilder';
import { Share } from './pages/Share';
import { OnboardingTour, useTourStatus } from './components/OnboardingTour';
import { useHouseholdContext } from './context/HouseholdContext';

function AppContent() {
  const { household } = useHouseholdContext();
  const { hasSeenTour, setHasSeenTour } = useTourStatus();
  const [showTour, setShowTour] = useState(!hasSeenTour);

  if (!household) {
    if (showTour) {
      return (
        <OnboardingTour
          onComplete={() => {
            setShowTour(false);
            setHasSeenTour(true);
          }}
        />
      );
    }
    return <Setup />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calculator" element={<RentCalculator />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/settle" element={<Settlement />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/agreement" element={<AgreementBuilder />} />
        <Route path="/share" element={<Share />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <HouseholdProvider>
      <AppContent />
    </HouseholdProvider>
  );
}

export default App;
