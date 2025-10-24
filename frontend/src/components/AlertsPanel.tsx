import { useState, useEffect } from 'react';
import { alertService, apiKeyService, SpendingAlert, ApiKey } from '../services/api';

interface AlertsPanelProps {
  onClose: () => void;
}

export default function AlertsPanel({ onClose }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<SpendingAlert[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newAlert, setNewAlert] = useState({
    apiKeyId: 0,
    thresholdAmount: 10,
    thresholdType: 'daily' as 'daily' | 'monthly',
    alertEmail: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, keysRes] = await Promise.all([
        alertService.getAll(),
        apiKeyService.getAll(),
      ]);
      setAlerts(alertsRes.data);
      setApiKeys(keysRes.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await alertService.create(newAlert);
      setShowAddForm(false);
      setNewAlert({
        apiKeyId: 0,
        thresholdAmount: 10,
        thresholdType: 'daily',
        alertEmail: '',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to create alert:', err);
    }
  };

  const handleToggleAlert = async (id: number, isEnabled: boolean) => {
    try {
      await alertService.update(id, { isEnabled: !isEnabled });
      fetchData();
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  const handleDeleteAlert = async (id: number) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    try {
      await alertService.delete(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  const getKeyLabel = (keyId: number) => {
    return apiKeys.find((k) => k.id === keyId)?.label || 'Unknown';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Spending Alerts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="card flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {getKeyLabel(alert.api_key_id)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Alert when {alert.threshold_type} spend exceeds $
                        {alert.threshold_amount}
                      </p>
                      {alert.alert_email && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Email: {alert.alert_email}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleAlert(alert.id, alert.is_enabled)}
                        className={`px-3 py-1 text-sm rounded ${
                          alert.is_enabled
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {alert.is_enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

                {alerts.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No alerts configured yet
                  </div>
                )}
              </div>

              {showAddForm ? (
                <form onSubmit={handleAddAlert} className="card space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Create New Alert
                  </h3>

                  <div>
                    <label className="label">API Key</label>
                    <select
                      className="input w-full"
                      value={newAlert.apiKeyId}
                      onChange={(e) =>
                        setNewAlert({ ...newAlert, apiKeyId: parseInt(e.target.value) })
                      }
                      required
                    >
                      <option value={0}>Select a key...</option>
                      {apiKeys.map((key) => (
                        <option key={key.id} value={key.id}>
                          {key.label} ({key.provider})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Threshold Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input w-full"
                      value={newAlert.thresholdAmount}
                      onChange={(e) =>
                        setNewAlert({
                          ...newAlert,
                          thresholdAmount: parseFloat(e.target.value),
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Period</label>
                    <select
                      className="input w-full"
                      value={newAlert.thresholdType}
                      onChange={(e) =>
                        setNewAlert({
                          ...newAlert,
                          thresholdType: e.target.value as 'daily' | 'monthly',
                        })
                      }
                    >
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Email (Optional)</label>
                    <input
                      type="email"
                      className="input w-full"
                      placeholder="your@email.com"
                      value={newAlert.alertEmail}
                      onChange={(e) =>
                        setNewAlert({ ...newAlert, alertEmail: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary flex-1">
                      Create Alert
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn btn-primary w-full"
                >
                  + Add New Alert
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
