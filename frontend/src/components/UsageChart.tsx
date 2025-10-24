import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { usageService, UsageSnapshot } from '../services/api';
import { format } from 'date-fns';

interface UsageChartProps {
  keyId: number;
}

export default function UsageChart({ keyId }: UsageChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [keyId, days]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await usageService.getTimeSeries(keyId, days);
      const chartData = response.data.map((snapshot: UsageSnapshot) => ({
        date: format(new Date(snapshot.snapshot_date), 'MMM dd'),
        cost: parseFloat(snapshot.total_cost.toString()),
        tokens: snapshot.token_usage,
      }));
      setData(chartData);
    } catch (err) {
      console.error('Failed to fetch usage data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No usage data available for this time period
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Cost Over Time
        </h4>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="input text-sm py-1"
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg)',
              border: '1px solid var(--tooltip-border)',
              borderRadius: '0.5rem',
            }}
            formatter={(value: any) => [`$${value.toFixed(4)}`, 'Cost']}
          />
          <Line
            type="monotone"
            dataKey="cost"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ fill: '#0ea5e9', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
