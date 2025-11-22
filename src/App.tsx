import { Routes, Route } from 'react-router-dom';
import { HouseholdProvider } from './context/HouseholdContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { RentCalculator } from './pages/RentCalculator';
import { Expenses } from './pages/Expenses';
import { Settlement } from './pages/Settlement';
import { Settings } from './pages/Settings';
import { Setup } from './pages/Setup';
import { useHouseholdContext } from './context/HouseholdContext';

function AppContent() {
  const { household } = useHouseholdContext();

  if (!household) {
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
