import { Router, Request, Response } from 'express';
import { query } from '../database/connection';

const router = Router();

interface UsageSnapshot {
  id: number;
  api_key_id: number;
  snapshot_date: string;
  total_cost: number;
  token_usage: number;
  request_count: number;
  model_breakdown: any;
}

interface DashboardCard {
  keyId: number;
  label: string;
  provider: string;
  workspace: string | null;
  currentBalance: number;
  mtdSpend: number;
  dailyAverage: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

// Get aggregated dashboard data
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query;

    let days = 30;
    if (timeRange === '7d') days = 7;
    else if (timeRange === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all active keys with their recent usage
    const dashboardData = await query<any[]>(
      `SELECT
        k.id as keyId,
        k.label,
        k.provider,
        k.workspace,
        COALESCE(SUM(u.total_cost), 0) as totalSpend,
        COALESCE(SUM(u.token_usage), 0) as totalTokens,
        COALESCE(AVG(u.total_cost), 0) as avgDailyCost,
        MAX(u.snapshot_date) as lastUpdated
      FROM api_keys k
      LEFT JOIN usage_snapshots u ON k.id = u.api_key_id
        AND u.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      WHERE k.is_active = true
      GROUP BY k.id, k.label, k.provider, k.workspace
      ORDER BY totalSpend DESC`,
      [days]
    );

    // Calculate month-to-date for each key
    const mtdData = await query<any[]>(
      `SELECT
        api_key_id,
        COALESCE(SUM(total_cost), 0) as mtdSpend
      FROM usage_snapshots
      WHERE snapshot_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
      GROUP BY api_key_id`
    );

    const mtdMap = new Map(mtdData.map(d => [d.api_key_id, d.mtdSpend]));

    const cards: DashboardCard[] = dashboardData.map(row => ({
      keyId: row.keyId,
      label: row.label,
      provider: row.provider,
      workspace: row.workspace,
      currentBalance: 0, // Would need to fetch from provider API
      mtdSpend: mtdMap.get(row.keyId) || 0,
      dailyAverage: parseFloat(row.avgDailyCost) || 0,
      trend: 'stable', // Calculate based on recent trends
      lastUpdated: row.lastUpdated || new Date().toISOString(),
    }));

    // Calculate totals
    const totals = {
      totalSpend: cards.reduce((sum, c) => sum + c.mtdSpend, 0),
      totalKeys: cards.length,
      avgDailySpend: cards.reduce((sum, c) => sum + c.dailyAverage, 0),
    };

    res.json({ cards, totals });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get usage time series for a specific key
router.get('/timeseries/:keyId', async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const { days = '30' } = req.query;

    const daysNum = parseInt(days as string);

    const timeSeries = await query<UsageSnapshot[]>(
      `SELECT
        snapshot_date,
        total_cost,
        token_usage,
        request_count,
        model_breakdown
      FROM usage_snapshots
      WHERE api_key_id = ?
        AND snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY snapshot_date ASC`,
      [keyId, daysNum]
    );

    res.json(timeSeries);
  } catch (error) {
    console.error('Error fetching time series:', error);
    res.status(500).json({ error: 'Failed to fetch time series data' });
  }
});

// Get usage comparison across multiple keys
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const { keyIds, days = '30' } = req.query;

    if (!keyIds) {
      return res.status(400).json({ error: 'keyIds parameter is required' });
    }

    const ids = (keyIds as string).split(',').map(id => parseInt(id));
    const daysNum = parseInt(days as string);

    const placeholders = ids.map(() => '?').join(',');

    const comparison = await query<any[]>(
      `SELECT
        k.id,
        k.label,
        k.provider,
        DATE(u.snapshot_date) as date,
        COALESCE(u.total_cost, 0) as cost
      FROM api_keys k
      LEFT JOIN usage_snapshots u ON k.id = u.api_key_id
        AND u.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      WHERE k.id IN (${placeholders})
      ORDER BY k.id, u.snapshot_date`,
      [daysNum, ...ids]
    );

    res.json(comparison);
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    res.status(500).json({ error: 'Failed to fetch comparison data' });
  }
});

// Get model breakdown for a key
router.get('/models/:keyId', async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const { days = '30' } = req.query;

    const daysNum = parseInt(days as string);

    const snapshots = await query<any[]>(
      `SELECT model_breakdown
      FROM usage_snapshots
      WHERE api_key_id = ?
        AND snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY snapshot_date DESC`,
      [keyId, daysNum]
    );

    // Aggregate model breakdowns
    const modelTotals: Record<string, number> = {};

    snapshots.forEach(snapshot => {
      if (snapshot.model_breakdown) {
        const breakdown = typeof snapshot.model_breakdown === 'string'
          ? JSON.parse(snapshot.model_breakdown)
          : snapshot.model_breakdown;

        Object.entries(breakdown).forEach(([model, cost]) => {
          modelTotals[model] = (modelTotals[model] || 0) + (cost as number);
        });
      }
    });

    res.json(modelTotals);
  } catch (error) {
    console.error('Error fetching model breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch model breakdown' });
  }
});

export default router;
