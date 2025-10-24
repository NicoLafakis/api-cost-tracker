import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AddKeyModal from './components/AddKeyModal';
import AlertsPanel from './components/AlertsPanel';
import { apiKeyService } from './services/api';

function App() {
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleKeyAdded = () => {
    setShowAddKeyModal(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header
          onAddKey={() => setShowAddKeyModal(true)}
          onShowAlerts={() => setShowAlertsPanel(true)}
        />

        {!isOnline && (
          <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm">
            You are offline. Showing cached data.
          </div>
        )}

        <main className="container mx-auto px-4 py-8">
          <Dashboard refreshTrigger={refreshTrigger} />
        </main>

        {showAddKeyModal && (
          <AddKeyModal
            onClose={() => setShowAddKeyModal(false)}
            onSuccess={handleKeyAdded}
          />
        )}

        {showAlertsPanel && (
          <AlertsPanel onClose={() => setShowAlertsPanel(false)} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
