import { Router, Request, Response } from 'express';
import { query } from '../database/connection';

const router = Router();

// Get all preferences
router.get('/', async (req: Request, res: Response) => {
  try {
    const prefs = await query<any[]>(
      'SELECT preference_key, preference_value FROM user_preferences'
    );

    const preferences: Record<string, string> = {};
    prefs.forEach(pref => {
      preferences[pref.preference_key] = pref.preference_value;
    });

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update preference
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'value is required' });
    }

    await query(
      `INSERT INTO user_preferences (preference_key, preference_value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE preference_value = VALUES(preference_value)`,
      [key, value]
    );

    res.json({ message: 'Preference updated successfully' });
  } catch (error) {
    console.error('Error updating preference:', error);
    res.status(500).json({ error: 'Failed to update preference' });
  }
});

export default router;
