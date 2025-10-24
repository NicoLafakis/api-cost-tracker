import { useState, useEffect } from 'react';
import { usageService, DashboardData } from '../services/api';
import DashboardCard from './DashboardCard';
import TimeRangeSelector from './TimeRangeSelector';

interface DashboardProps {
  refreshTrigger: number;
}

export default function Dashboard({ refreshTrigger }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, refreshTrigger]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usageService.getDashboard(timeRange);
      setDashboardData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Using cached data if available.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Usage Dashboard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor your API costs across all keys
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
        </div>
      )}

      {dashboardData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total MTD Spend
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                ${dashboardData.totals.totalSpend.toFixed(2)}
              </p>
            </div>

            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Active Keys
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {dashboardData.totals.totalKeys}
              </p>
            </div>

            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Avg Daily Spend
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                ${dashboardData.totals.avgDailySpend.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboardData.cards.map((card) => (
              <DashboardCard key={card.keyId} data={card} />
            ))}
          </div>

          {dashboardData.cards.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No API keys added yet. Click "Add API Key" to get started.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
