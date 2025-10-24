import { Router, Request, Response } from 'express';
import { query } from '../database/connection';

const router = Router();

interface SpendingAlert {
  id: number;
  api_key_id: number;
  threshold_amount: number;
  threshold_type: 'daily' | 'monthly';
  alert_email: string | null;
  is_enabled: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

// Get all alerts for a specific API key
router.get('/key/:keyId', async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;

    const alerts = await query<SpendingAlert[]>(
      'SELECT * FROM spending_alerts WHERE api_key_id = ? ORDER BY created_at DESC',
      [keyId]
    );

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get all alerts
router.get('/', async (req: Request, res: Response) => {
  try {
    const alerts = await query<any[]>(
      `SELECT
        a.*,
        k.label as key_label,
        k.provider
      FROM spending_alerts a
      JOIN api_keys k ON a.api_key_id = k.id
      WHERE k.is_active = true
      ORDER BY a.created_at DESC`
    );

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Create new alert
router.post('/', async (req: Request, res: Response) => {
  try {
    const { apiKeyId, thresholdAmount, thresholdType, alertEmail } = req.body;

    if (!apiKeyId || !thresholdAmount || !thresholdType) {
      return res.status(400).json({
        error: 'apiKeyId, thresholdAmount, and thresholdType are required',
      });
    }

    if (thresholdType !== 'daily' && thresholdType !== 'monthly') {
      return res.status(400).json({
        error: 'thresholdType must be daily or monthly',
      });
    }

    const result = await query<any>(
      `INSERT INTO spending_alerts (api_key_id, threshold_amount, threshold_type, alert_email)
      VALUES (?, ?, ?, ?)`,
      [apiKeyId, thresholdAmount, thresholdType, alertEmail || null]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Alert created successfully',
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Update alert
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { thresholdAmount, thresholdType, alertEmail, isEnabled } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (thresholdAmount !== undefined) {
      updates.push('threshold_amount = ?');
      values.push(thresholdAmount);
    }

    if (thresholdType !== undefined) {
      updates.push('threshold_type = ?');
      values.push(thresholdType);
    }

    if (alertEmail !== undefined) {
      updates.push('alert_email = ?');
      values.push(alertEmail);
    }

    if (isEnabled !== undefined) {
      updates.push('is_enabled = ?');
      values.push(isEnabled);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);

    await query(`UPDATE spending_alerts SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ message: 'Alert updated successfully' });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Delete alert
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM spending_alerts WHERE id = ?', [id]);

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export default router;
