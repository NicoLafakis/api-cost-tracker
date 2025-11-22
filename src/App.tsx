import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HouseholdProvider } from './context/HouseholdContext';
import { ToastProvider } from './components/Toast';
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
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { OnboardingTour, useTourStatus } from './components/OnboardingTour';
import { useHouseholdContext } from './context/HouseholdContext';
import { Loading } from './components/Loading';

function AuthenticatedContent() {
  const { household, isLoading } = useHouseholdContext();
  const { hasSeenTour, setHasSeenTour } = useTourStatus();
  const [showTour, setShowTour] = useState(!hasSeenTour);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

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
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <p className="text-gray-600">Loading RoomSplit...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <HouseholdProvider>
      <AuthenticatedContent />
    </HouseholdProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
