import { useState } from 'react';
import { DashboardCard as DashboardCardType } from '../services/api';
import UsageChart from './UsageChart';

interface DashboardCardProps {
  data: DashboardCardType;
}

export default function DashboardCard({ data }: DashboardCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getTrendIcon = () => {
    if (data.trend === 'up') return '📈';
    if (data.trend === 'down') return '📉';
    return '➡️';
  };

  const getProviderColor = () => {
    return data.provider === 'openai' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800';
  };

  const getProviderColorDark = () => {
    return data.provider === 'openai' ? 'dark:bg-green-900 dark:text-green-200' : 'dark:bg-purple-900 dark:text-purple-200';
  };

  const timeSinceUpdate = () => {
    const now = new Date();
    const updated = new Date(data.lastUpdated);
    const diffMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.label}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded ${getProviderColor()} ${getProviderColorDark()}`}>
              {data.provider}
            </span>
          </div>
          {data.workspace && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{data.workspace}</p>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">MTD Spend</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            ${data.mtdSpend.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Daily Avg</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            ${data.dailyAverage.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Trend</p>
          <p className="text-xl">{getTrendIcon()}</p>
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Updated {timeSinceUpdate()}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
          <UsageChart keyId={data.keyId} />
        </div>
      )}
    </div>
  );
}
